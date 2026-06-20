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
  consultationXrayAnalysis,
  patient,
  patientDocument,
} from '../../database/schema';
import {
  MINIO_CATEGORY_PREFIX,
  XRAY_IMAGE_MAX_BYTES,
  XRAY_IMAGE_MIME_TYPES,
} from '../../shared/storage/minio.constants';
import { MinioService } from '../../shared/storage/minio.service';
import { DoctorVerifierService } from '../../shared/doctor/doctor-verifier.service';
import type {
  SaveConsultationXrayAnalysisDto,
  XrayRiskLevel,
} from './dto/consultation-xray.dto';

function isConsultationXrayKey(key: string): boolean {
  return key.startsWith(`${MINIO_CATEGORY_PREFIX.consultation_xray}/`);
}

@Injectable()
export class ConsultationXrayService {
  constructor(
    @Inject(DRIZZLE) private readonly db: Database,
    private readonly minioService: MinioService,
    private readonly doctorVerifier: DoctorVerifierService,
  ) {}

  async createUploadIntent(
    doctorUserId: number,
    patientId: string,
    fileName: string,
    contentType: string,
  ) {
    await this.doctorVerifier.verify(doctorUserId);

    const patientRow = await this.db.query.patient.findFirst({
      where: eq(patient.id, patientId),
    });
    if (!patientRow) throw new NotFoundException('Patient not found');

    const mimeType = contentType.trim().toLowerCase();
    if (!XRAY_IMAGE_MIME_TYPES.has(mimeType)) {
      throw new BadRequestException('Unsupported X-ray image type');
    }

    return this.minioService.createUploadIntent({
      fileName,
      contentType: mimeType,
      category: 'consultation_xray',
      patientId,
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

    const conditions = [eq(consultationXrayAnalysis.patientId, patientId)];
    if (consultationId) {
      conditions.push(eq(consultationXrayAnalysis.consultationId, consultationId));
    }

    const rows = await this.db.query.consultationXrayAnalysis.findMany({
      where: and(...conditions),
      orderBy: desc(consultationXrayAnalysis.createdAt),
    });

    return Promise.all(rows.map((row) => this.mapAnalysisRow(row)));
  }

  async saveAnalysis(
    doctorUserId: number,
    patientId: string,
    dto: SaveConsultationXrayAnalysisDto,
  ) {
    const doctorRow = await this.doctorVerifier.verify(doctorUserId);

    const patientRow = await this.db.query.patient.findFirst({
      where: eq(patient.id, patientId),
    });
    if (!patientRow) throw new NotFoundException('Patient not found');

    const originalDoc = await this.assertXrayDocument(
      dto.originalDocumentId,
      patientId,
    );
    const annotatedDoc = await this.assertXrayDocument(
      dto.annotatedDocumentId,
      patientId,
    );

    if (dto.consultationId) {
      const existing = await this.db.query.consultationXrayAnalysis.findFirst({
        where: and(
          eq(consultationXrayAnalysis.patientId, patientId),
          eq(consultationXrayAnalysis.consultationId, dto.consultationId),
        ),
      });
      if (existing) {
        await this.deleteAnalysisRow(existing.id, patientId);
      }
    }

    const analysisPayload = {
      findings: dto.findings,
      interpretation: dto.interpretation,
      totalDetections: dto.totalDetections,
      inferenceTimeMs: dto.inferenceTimeMs,
      riskLevel: dto.riskLevel,
    };

    const [saved] = await this.db
      .insert(consultationXrayAnalysis)
      .values({
        patientId,
        consultationId: dto.consultationId,
        originalDocumentId: dto.originalDocumentId,
        annotatedDocumentId: dto.annotatedDocumentId,
        fileName: dto.fileName ?? originalDoc.fileName ?? 'Chest X-ray',
        riskLevel: dto.riskLevel,
        analysisJson: JSON.stringify(analysisPayload),
      })
      .returning();

    return this.mapAnalysisRow(saved, {
      originalDoc,
      annotatedDoc,
      uploadedByUserId: doctorRow.userId,
    });
  }

  async deleteAnalysis(
    doctorUserId: number,
    patientId: string,
    analysisId: string,
  ) {
    await this.doctorVerifier.verify(doctorUserId);

    const row = await this.db.query.consultationXrayAnalysis.findFirst({
      where: and(
        eq(consultationXrayAnalysis.id, analysisId),
        eq(consultationXrayAnalysis.patientId, patientId),
      ),
    });
    if (!row) throw new NotFoundException('X-ray analysis not found');

    await this.deleteAnalysisRow(analysisId, patientId);
    return { success: true };
  }

  private async deleteAnalysisRow(analysisId: string, patientId: string) {
    const row = await this.db.query.consultationXrayAnalysis.findFirst({
      where: and(
        eq(consultationXrayAnalysis.id, analysisId),
        eq(consultationXrayAnalysis.patientId, patientId),
      ),
    });
    if (!row) return;

    for (const documentId of [row.originalDocumentId, row.annotatedDocumentId]) {
      if (!documentId) continue;
      const doc = await this.db.query.patientDocument.findFirst({
        where: eq(patientDocument.id, documentId),
      });
      if (doc && isConsultationXrayKey(doc.s3Key)) {
        await this.minioService.deleteObject(doc.s3Key);
      }
      if (doc) {
        await this.db
          .delete(patientDocument)
          .where(eq(patientDocument.id, doc.id));
      }
    }

    await this.db
      .delete(consultationXrayAnalysis)
      .where(eq(consultationXrayAnalysis.id, analysisId));
  }

  private async assertXrayDocument(documentId: string, patientId: string) {
    const doc = await this.db.query.patientDocument.findFirst({
      where: and(
        eq(patientDocument.id, documentId),
        eq(patientDocument.patientId, patientId),
      ),
    });
    if (!doc) throw new NotFoundException('Document not found');
    if (!isConsultationXrayKey(doc.s3Key)) {
      throw new BadRequestException('Invalid X-ray storage key');
    }
    if (doc.sizeBytes != null && doc.sizeBytes > XRAY_IMAGE_MAX_BYTES) {
      throw new BadRequestException('X-ray image exceeds allowed size');
    }
    return doc;
  }

  private async mapAnalysisRow(
    row: typeof consultationXrayAnalysis.$inferSelect,
    docs?: {
      originalDoc: typeof patientDocument.$inferSelect;
      annotatedDoc: typeof patientDocument.$inferSelect;
      uploadedByUserId?: number;
    },
  ) {
    const originalDoc =
      docs?.originalDoc ??
      (row.originalDocumentId
        ? await this.db.query.patientDocument.findFirst({
            where: eq(patientDocument.id, row.originalDocumentId),
          })
        : null);
    const annotatedDoc =
      docs?.annotatedDoc ??
      (row.annotatedDocumentId
        ? await this.db.query.patientDocument.findFirst({
            where: eq(patientDocument.id, row.annotatedDocumentId),
          })
        : null);

    const analysis = JSON.parse(row.analysisJson) as {
      findings: Record<string, number>;
      interpretation: string[];
      totalDetections: number;
      inferenceTimeMs: number;
      riskLevel: XrayRiskLevel;
    };

    const [originalImageUrl, annotatedImageUrl] = await Promise.all([
      originalDoc?.s3Key
        ? this.minioService.createDownloadUrl({ key: originalDoc.s3Key })
        : null,
      annotatedDoc?.s3Key
        ? this.minioService.createDownloadUrl({ key: annotatedDoc.s3Key })
        : null,
    ]);

    return {
      id: row.id,
      patientId: row.patientId,
      consultationId: row.consultationId,
      fileName: row.fileName,
      riskLevel: row.riskLevel as XrayRiskLevel,
      findings: analysis.findings ?? {},
      interpretation: analysis.interpretation ?? [],
      totalDetections: analysis.totalDetections ?? 0,
      inferenceTimeMs: analysis.inferenceTimeMs ?? 0,
      createdAt: row.createdAt.toISOString(),
      originalDocumentId: row.originalDocumentId,
      annotatedDocumentId: row.annotatedDocumentId,
      originalImageUrl,
      annotatedImageUrl,
      originalDocument: originalDoc
        ? {
            id: originalDoc.id,
            fileName: originalDoc.fileName,
            contentType: originalDoc.contentType,
            sizeBytes: originalDoc.sizeBytes,
          }
        : null,
      annotatedDocument: annotatedDoc
        ? {
            id: annotatedDoc.id,
            fileName: annotatedDoc.fileName,
            contentType: annotatedDoc.contentType,
            sizeBytes: annotatedDoc.sizeBytes,
          }
        : null,
    };
  }
}
