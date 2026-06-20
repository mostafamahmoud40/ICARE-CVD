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
  consultationEchoAnalysis,
  patient,
  patientDocument,
} from '../../database/schema';
import {
  ECHO_VIDEO_MAX_BYTES,
  ECHO_VIDEO_MIME_TYPES,
  MINIO_CATEGORY_PREFIX,
} from '../../shared/storage/minio.constants';
import { MinioService } from '../../shared/storage/minio.service';
import { DoctorVerifierService } from '../../shared/doctor/doctor-verifier.service';
import type {
  SaveConsultationEchoAnalysisDto,
  UpdateConsultationEchoReportDto,
} from './dto/consultation-echo.dto';

function isConsultationEchoKey(key: string): boolean {
  return key.startsWith(`${MINIO_CATEGORY_PREFIX.consultation_echo}/`);
}

@Injectable()
export class ConsultationEchoService {
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
    const isVideoMime = ECHO_VIDEO_MIME_TYPES.has(mimeType);
    const isVideoExt = /\.(avi|mp4|mov|webm|mkv)$/i.test(fileName);
    const isImageMime = mimeType === 'image/gif' || mimeType === 'image/png';
    const isImageExt = /\.(gif|png)$/i.test(fileName);
    if (!isVideoMime && !isVideoExt && !isImageMime && !isImageExt) {
      throw new BadRequestException('Unsupported echocardiogram file type');
    }

    const resolvedContentType = isImageMime
      ? mimeType
      : isVideoMime
        ? mimeType
        : isImageExt
          ? fileName.toLowerCase().endsWith('.gif')
            ? 'image/gif'
            : 'image/png'
          : 'video/mp4';

    return this.minioService.createUploadIntent({
      fileName,
      contentType: resolvedContentType,
      category: 'consultation_echo',
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

    const conditions = [eq(consultationEchoAnalysis.patientId, patientId)];
    if (consultationId) {
      conditions.push(eq(consultationEchoAnalysis.consultationId, consultationId));
    }

    const rows = await this.db.query.consultationEchoAnalysis.findMany({
      where: and(...conditions),
      orderBy: desc(consultationEchoAnalysis.createdAt),
    });

    return Promise.all(rows.map((row) => this.mapAnalysisRow(row)));
  }

  async saveAnalysis(
    doctorUserId: number,
    patientId: string,
    dto: SaveConsultationEchoAnalysisDto,
  ) {
    await this.doctorVerifier.verify(doctorUserId);

    const patientRow = await this.db.query.patient.findFirst({
      where: eq(patient.id, patientId),
    });
    if (!patientRow) throw new NotFoundException('Patient not found');

    const videoDoc = await this.assertEchoDocument(dto.videoDocumentId, patientId);
    const overlayDoc = await this.assertEchoDocument(
      dto.overlayGifDocumentId,
      patientId,
    );
    const frameDoc = await this.assertEchoDocument(
      dto.frameVizDocumentId,
      patientId,
    );

    if (dto.consultationId) {
      const existing = await this.db.query.consultationEchoAnalysis.findFirst({
        where: and(
          eq(consultationEchoAnalysis.patientId, patientId),
          eq(consultationEchoAnalysis.consultationId, dto.consultationId),
        ),
      });
      if (existing) {
        await this.deleteAnalysisRow(existing.id, patientId);
      }
    }

    const analysisPayload = {
      ef: dto.ef,
      label: dto.label,
      es_frame: dto.es_frame,
      ed_frame: dto.ed_frame,
      es_area: dto.es_area,
      ed_area: dto.ed_area,
      total_frames: dto.total_frames,
      device: dto.device,
      chart_data: dto.chart_data,
    };

    const [saved] = await this.db
      .insert(consultationEchoAnalysis)
      .values({
        patientId,
        consultationId: dto.consultationId,
        videoDocumentId: dto.videoDocumentId,
        overlayGifDocumentId: dto.overlayGifDocumentId,
        frameVizDocumentId: dto.frameVizDocumentId,
        fileName: dto.fileName ?? videoDoc.fileName ?? 'Echocardiogram',
        analysisJson: JSON.stringify(analysisPayload),
      })
      .returning();

    return this.mapAnalysisRow(saved, {
      videoDoc,
      overlayDoc,
      frameDoc,
    });
  }

  async updateReport(
    doctorUserId: number,
    patientId: string,
    analysisId: string,
    dto: UpdateConsultationEchoReportDto,
  ) {
    await this.doctorVerifier.verify(doctorUserId);

    const row = await this.db.query.consultationEchoAnalysis.findFirst({
      where: and(
        eq(consultationEchoAnalysis.id, analysisId),
        eq(consultationEchoAnalysis.patientId, patientId),
      ),
    });
    if (!row) throw new NotFoundException('Echo analysis not found');

    const [updated] = await this.db
      .update(consultationEchoAnalysis)
      .set({
        aiReport: dto.aiReport.trim(),
        updatedAt: new Date(),
      })
      .where(eq(consultationEchoAnalysis.id, analysisId))
      .returning();

    return this.mapAnalysisRow(updated);
  }

  async deleteAnalysis(
    doctorUserId: number,
    patientId: string,
    analysisId: string,
  ) {
    await this.doctorVerifier.verify(doctorUserId);

    const row = await this.db.query.consultationEchoAnalysis.findFirst({
      where: and(
        eq(consultationEchoAnalysis.id, analysisId),
        eq(consultationEchoAnalysis.patientId, patientId),
      ),
    });
    if (!row) throw new NotFoundException('Echo analysis not found');

    await this.deleteAnalysisRow(analysisId, patientId);
    return { success: true };
  }

  private async deleteAnalysisRow(analysisId: string, patientId: string) {
    const row = await this.db.query.consultationEchoAnalysis.findFirst({
      where: and(
        eq(consultationEchoAnalysis.id, analysisId),
        eq(consultationEchoAnalysis.patientId, patientId),
      ),
    });
    if (!row) return;

    for (const documentId of [
      row.videoDocumentId,
      row.overlayGifDocumentId,
      row.frameVizDocumentId,
    ]) {
      if (!documentId) continue;
      const doc = await this.db.query.patientDocument.findFirst({
        where: eq(patientDocument.id, documentId),
      });
      if (doc && isConsultationEchoKey(doc.s3Key)) {
        await this.minioService.deleteObject(doc.s3Key);
      }
      if (doc) {
        await this.db
          .delete(patientDocument)
          .where(eq(patientDocument.id, doc.id));
      }
    }

    await this.db
      .delete(consultationEchoAnalysis)
      .where(eq(consultationEchoAnalysis.id, analysisId));
  }

  private async assertEchoDocument(documentId: string, patientId: string) {
    const doc = await this.db.query.patientDocument.findFirst({
      where: and(
        eq(patientDocument.id, documentId),
        eq(patientDocument.patientId, patientId),
      ),
    });
    if (!doc) throw new NotFoundException('Document not found');
    if (!isConsultationEchoKey(doc.s3Key)) {
      throw new BadRequestException('Invalid echo storage key');
    }
    if (doc.sizeBytes != null && doc.sizeBytes > ECHO_VIDEO_MAX_BYTES) {
      throw new BadRequestException('Echo file exceeds allowed size');
    }
    return doc;
  }

  private async mapAnalysisRow(
    row: typeof consultationEchoAnalysis.$inferSelect,
    docs?: {
      videoDoc: typeof patientDocument.$inferSelect;
      overlayDoc: typeof patientDocument.$inferSelect;
      frameDoc: typeof patientDocument.$inferSelect;
    },
  ) {
    const videoDoc =
      docs?.videoDoc ??
      (row.videoDocumentId
        ? await this.db.query.patientDocument.findFirst({
            where: eq(patientDocument.id, row.videoDocumentId),
          })
        : null);
    const overlayDoc =
      docs?.overlayDoc ??
      (row.overlayGifDocumentId
        ? await this.db.query.patientDocument.findFirst({
            where: eq(patientDocument.id, row.overlayGifDocumentId),
          })
        : null);
    const frameDoc =
      docs?.frameDoc ??
      (row.frameVizDocumentId
        ? await this.db.query.patientDocument.findFirst({
            where: eq(patientDocument.id, row.frameVizDocumentId),
          })
        : null);

    const analysis = JSON.parse(row.analysisJson) as {
      ef: number;
      label: string;
      es_frame: number;
      ed_frame: number;
      es_area: number;
      ed_area: number;
      total_frames: number;
      device: string;
      chart_data: {
        areas: number[];
        es_frame: number;
        ed_frame: number;
        systole_frames: number[];
      };
    };

    const [videoUrl, overlayGifUrl, frameVizUrl] = await Promise.all([
      videoDoc?.s3Key
        ? this.minioService.createDownloadUrl({ key: videoDoc.s3Key })
        : null,
      overlayDoc?.s3Key
        ? this.minioService.createDownloadUrl({ key: overlayDoc.s3Key })
        : null,
      frameDoc?.s3Key
        ? this.minioService.createDownloadUrl({ key: frameDoc.s3Key })
        : null,
    ]);

    return {
      id: row.id,
      patientId: row.patientId,
      consultationId: row.consultationId,
      fileName: row.fileName,
      aiReport: row.aiReport,
      ef: analysis.ef,
      label: analysis.label,
      es_frame: analysis.es_frame,
      ed_frame: analysis.ed_frame,
      es_area: analysis.es_area,
      ed_area: analysis.ed_area,
      total_frames: analysis.total_frames,
      device: analysis.device,
      chart_data: analysis.chart_data,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
      videoDocumentId: row.videoDocumentId,
      overlayGifDocumentId: row.overlayGifDocumentId,
      frameVizDocumentId: row.frameVizDocumentId,
      videoUrl,
      overlayGifUrl,
      frameVizUrl,
      videoDocument: videoDoc
        ? {
            id: videoDoc.id,
            fileName: videoDoc.fileName,
            contentType: videoDoc.contentType,
            sizeBytes: videoDoc.sizeBytes,
          }
        : null,
    };
  }
}
