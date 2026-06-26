import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, desc, eq } from 'drizzle-orm';
import { DRIZZLE } from '../../database/drizzle.provider';
import type { Database } from '../../database/drizzle.provider';
import {
  consultationEcgAnalysis,
  patient,
  patientDocument,
} from '../../database/schema';
import { isMinioKeyForCategory } from '../../shared/storage/minio-patient-path';
import { ECG_FILE_MAX_BYTES } from '../../shared/storage/minio.constants';
import { MinioService } from '../../shared/storage/minio.service';
import { DoctorVerifierService } from '../../shared/doctor/doctor-verifier.service';
import type {
  SaveConsultationEcgAnalysisDto,
  UpdateConsultationEcgReportDto,
} from './dto/consultation-ecg.dto';

@Injectable()
export class ConsultationEcgService {
  constructor(
    @Inject(DRIZZLE) private readonly db: Database,
    private readonly minioService: MinioService,
    private readonly doctorVerifier: DoctorVerifierService,
  ) {}

  async createUploadIntent(
    doctorUserId: number,
    patientId: string,
    fileName: string,
    contentType?: string,
  ) {
    await this.doctorVerifier.verify(doctorUserId);

    const patientRow = await this.db.query.patient.findFirst({
      where: eq(patient.id, patientId),
    });
    if (!patientRow) throw new NotFoundException('Patient not found');

    const lower = fileName.toLowerCase();
    if (!lower.endsWith('.hea') && !lower.endsWith('.dat')) {
      throw new BadRequestException('ECG uploads must be .hea or .dat files');
    }

    const resolvedContentType =
      contentType?.trim() || 'application/octet-stream';

    return this.minioService.createUploadIntent({
      fileName,
      contentType: resolvedContentType,
      category: 'consultation_ecg',
      patientId,
      patientNumber: patientRow.patientNumber,
    });
  }

  async listAnalyses(
    doctorUserId: number,
    patientId: string,
    consultationId?: string,
  ) {
    await this.doctorVerifier.verify(doctorUserId);

    const patientRow = await this.db.query.patient.findFirst({
      where: eq(patient.id, patientId),
    });
    if (!patientRow) throw new NotFoundException('Patient not found');

    const conditions = [eq(consultationEcgAnalysis.patientId, patientId)];
    if (consultationId) {
      conditions.push(
        eq(consultationEcgAnalysis.consultationId, consultationId),
      );
    }

    const rows = await this.db.query.consultationEcgAnalysis.findMany({
      where: and(...conditions),
      orderBy: desc(consultationEcgAnalysis.createdAt),
    });

    return Promise.all(rows.map((row) => this.mapAnalysisRow(row)));
  }

  async saveAnalysis(
    doctorUserId: number,
    patientId: string,
    dto: SaveConsultationEcgAnalysisDto,
  ) {
    await this.doctorVerifier.verify(doctorUserId);

    const patientRow = await this.db.query.patient.findFirst({
      where: eq(patient.id, patientId),
    });
    if (!patientRow) throw new NotFoundException('Patient not found');

    const heaDoc = await this.assertEcgDocument(dto.heaDocumentId, patientId);
    const datDoc = await this.assertEcgDocument(dto.datDocumentId, patientId);

    if (dto.consultationId) {
      const existing = await this.db.query.consultationEcgAnalysis.findFirst({
        where: and(
          eq(consultationEcgAnalysis.patientId, patientId),
          eq(consultationEcgAnalysis.consultationId, dto.consultationId),
        ),
      });
      if (existing) {
        await this.deleteAnalysisRow(existing.id, patientId);
      }
    }

    const [saved] = await this.db
      .insert(consultationEcgAnalysis)
      .values({
        patientId,
        consultationId: dto.consultationId,
        heaDocumentId: dto.heaDocumentId,
        datDocumentId: dto.datDocumentId,
        recordName: dto.recordName ?? null,
        fileName: dto.fileName ?? heaDoc.fileName ?? 'ECG recording',
        analysisJson: JSON.stringify(dto.analysis),
        aiReportJson: dto.aiReport ? JSON.stringify(dto.aiReport) : null,
      })
      .returning();

    return this.mapAnalysisRow(saved, { heaDoc, datDoc });
  }

  async updateReport(
    doctorUserId: number,
    patientId: string,
    analysisId: string,
    dto: UpdateConsultationEcgReportDto,
  ) {
    await this.doctorVerifier.verify(doctorUserId);

    const row = await this.db.query.consultationEcgAnalysis.findFirst({
      where: and(
        eq(consultationEcgAnalysis.id, analysisId),
        eq(consultationEcgAnalysis.patientId, patientId),
      ),
    });
    if (!row) throw new NotFoundException('ECG analysis not found');

    const [updated] = await this.db
      .update(consultationEcgAnalysis)
      .set({
        aiReportJson: JSON.stringify(dto.aiReport),
        updatedAt: new Date(),
      })
      .where(eq(consultationEcgAnalysis.id, analysisId))
      .returning();

    return this.mapAnalysisRow(updated);
  }

  async deleteAnalysis(
    doctorUserId: number,
    patientId: string,
    analysisId: string,
  ) {
    await this.doctorVerifier.verify(doctorUserId);

    const row = await this.db.query.consultationEcgAnalysis.findFirst({
      where: and(
        eq(consultationEcgAnalysis.id, analysisId),
        eq(consultationEcgAnalysis.patientId, patientId),
      ),
    });
    if (!row) throw new NotFoundException('ECG analysis not found');

    await this.deleteAnalysisRow(analysisId, patientId);
    return { success: true };
  }

  private async deleteAnalysisRow(analysisId: string, patientId: string) {
    const row = await this.db.query.consultationEcgAnalysis.findFirst({
      where: and(
        eq(consultationEcgAnalysis.id, analysisId),
        eq(consultationEcgAnalysis.patientId, patientId),
      ),
    });
    if (!row) return;

    for (const documentId of [row.heaDocumentId, row.datDocumentId]) {
      if (!documentId) continue;
      const doc = await this.db.query.patientDocument.findFirst({
        where: eq(patientDocument.id, documentId),
      });
      if (doc && isMinioKeyForCategory(doc.s3Key, 'consultation_ecg')) {
        await this.minioService.deleteObject(doc.s3Key);
      }
      if (doc) {
        await this.db
          .delete(patientDocument)
          .where(eq(patientDocument.id, doc.id));
      }
    }

    await this.db
      .delete(consultationEcgAnalysis)
      .where(eq(consultationEcgAnalysis.id, analysisId));
  }

  private async assertEcgDocument(documentId: string, patientId: string) {
    const doc = await this.db.query.patientDocument.findFirst({
      where: and(
        eq(patientDocument.id, documentId),
        eq(patientDocument.patientId, patientId),
      ),
    });
    if (!doc) throw new NotFoundException('Document not found');
    if (!isMinioKeyForCategory(doc.s3Key, 'consultation_ecg')) {
      throw new BadRequestException('Invalid ECG storage key');
    }
    if (doc.sizeBytes != null && doc.sizeBytes > ECG_FILE_MAX_BYTES) {
      throw new BadRequestException('ECG file exceeds allowed size');
    }
    return doc;
  }

  private async mapAnalysisRow(
    row: typeof consultationEcgAnalysis.$inferSelect,
    docs?: {
      heaDoc: typeof patientDocument.$inferSelect;
      datDoc: typeof patientDocument.$inferSelect;
    },
  ) {
    const heaDoc =
      docs?.heaDoc ??
      (row.heaDocumentId
        ? await this.db.query.patientDocument.findFirst({
            where: eq(patientDocument.id, row.heaDocumentId),
          })
        : null);
    const datDoc =
      docs?.datDoc ??
      (row.datDocumentId
        ? await this.db.query.patientDocument.findFirst({
            where: eq(patientDocument.id, row.datDocumentId),
          })
        : null);

    const analysis = JSON.parse(row.analysisJson) as Record<string, unknown>;
    const aiReport = row.aiReportJson
      ? (JSON.parse(row.aiReportJson) as Record<string, unknown>)
      : null;

    return {
      id: row.id,
      patientId: row.patientId,
      consultationId: row.consultationId,
      recordName: row.recordName,
      fileName: row.fileName,
      analysis,
      aiReport,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
      heaDocumentId: row.heaDocumentId,
      datDocumentId: row.datDocumentId,
      heaDocument: heaDoc
        ? {
            id: heaDoc.id,
            fileName: heaDoc.fileName,
            contentType: heaDoc.contentType,
            sizeBytes: heaDoc.sizeBytes,
          }
        : null,
      datDocument: datDoc
        ? {
            id: datDoc.id,
            fileName: datDoc.fileName,
            contentType: datDoc.contentType,
            sizeBytes: datDoc.sizeBytes,
          }
        : null,
    };
  }
}
