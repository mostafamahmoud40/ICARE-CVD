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
  consultationCineMriAnalysis,
  patient,
  patientDocument,
} from '../../database/schema';
import { isMinioKeyForCategory } from '../../shared/storage/minio-patient-path';
import {
  CINE_MRI_IMAGE_MAX_BYTES,
  CINE_MRI_IMAGE_MIME_TYPES,
  CINE_MRI_NIFTI_MAX_BYTES,
  CINE_MRI_NIFTI_MIME_TYPES,
} from '../../shared/storage/minio.constants';
import { MinioService } from '../../shared/storage/minio.service';
import { DoctorVerifierService } from '../../shared/doctor/doctor-verifier.service';
import type { SaveConsultationCineMriAnalysisDto } from './dto/consultation-cine-mri.dto';

function isNiftiFile(fileName: string, contentType: string): boolean {
  const mime = contentType.trim().toLowerCase();
  return /\.nii(\.gz)?$/i.test(fileName) || CINE_MRI_NIFTI_MIME_TYPES.has(mime);
}

function isVisualizationFile(fileName: string, contentType: string): boolean {
  const mime = contentType.trim().toLowerCase();
  return CINE_MRI_IMAGE_MIME_TYPES.has(mime) || /\.(gif|png)$/i.test(fileName);
}

@Injectable()
export class ConsultationCineMriService {
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
    const nifti = isNiftiFile(fileName, mimeType);
    const image = isVisualizationFile(fileName, mimeType);
    if (!nifti && !image) {
      throw new BadRequestException('Unsupported cine-MRI file type');
    }

    const resolvedContentType = image
      ? mimeType === 'image/gif' || fileName.toLowerCase().endsWith('.gif')
        ? 'image/gif'
        : 'image/png'
      : fileName.toLowerCase().endsWith('.gz')
        ? 'application/gzip'
        : 'application/octet-stream';

    return this.minioService.createUploadIntent({
      fileName,
      contentType: resolvedContentType,
      category: 'consultation_cine_mri',
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

    const conditions = [eq(consultationCineMriAnalysis.patientId, patientId)];
    if (consultationId) {
      conditions.push(
        eq(consultationCineMriAnalysis.consultationId, consultationId),
      );
    }

    const rows = await this.db.query.consultationCineMriAnalysis.findMany({
      where: and(...conditions),
      orderBy: desc(consultationCineMriAnalysis.createdAt),
    });

    return Promise.all(rows.map((row) => this.mapAnalysisRow(row)));
  }

  async saveAnalysis(
    doctorUserId: number,
    patientId: string,
    dto: SaveConsultationCineMriAnalysisDto,
  ) {
    await this.doctorVerifier.verify(doctorUserId);

    const patientRow = await this.db.query.patient.findFirst({
      where: eq(patient.id, patientId),
    });
    if (!patientRow) throw new NotFoundException('Patient not found');

    const edDoc = await this.assertCineMriDocument(
      dto.edDocumentId,
      patientId,
      'nifti',
    );
    const esDoc = await this.assertCineMriDocument(
      dto.esDocumentId,
      patientId,
      'nifti',
    );
    const rawGifDoc = await this.assertCineMriDocument(
      dto.rawGifDocumentId,
      patientId,
      'image',
    );
    const segGifDoc = await this.assertCineMriDocument(
      dto.segGifDocumentId,
      patientId,
      'image',
    );
    const segGridEdDoc = await this.assertCineMriDocument(
      dto.segGridEdDocumentId,
      patientId,
      'image',
    );
    const segGridEsDoc = await this.assertCineMriDocument(
      dto.segGridEsDocumentId,
      patientId,
      'image',
    );

    if (dto.consultationId) {
      const existing =
        await this.db.query.consultationCineMriAnalysis.findFirst({
          where: and(
            eq(consultationCineMriAnalysis.patientId, patientId),
            eq(consultationCineMriAnalysis.consultationId, dto.consultationId),
          ),
        });
      if (existing) {
        await this.deleteAnalysisRow(existing.id, patientId);
      }
    }

    const analysisPayload = {
      elapsedSec: dto.elapsedSec,
      clinicalFeatures: dto.clinicalFeatures,
    };

    const [saved] = await this.db
      .insert(consultationCineMriAnalysis)
      .values({
        patientId,
        consultationId: dto.consultationId,
        edDocumentId: dto.edDocumentId,
        esDocumentId: dto.esDocumentId,
        rawGifDocumentId: dto.rawGifDocumentId,
        segGifDocumentId: dto.segGifDocumentId,
        segGridEdDocumentId: dto.segGridEdDocumentId,
        segGridEsDocumentId: dto.segGridEsDocumentId,
        diagnosisClass: dto.diagnosisClass,
        analysisJson: JSON.stringify(analysisPayload),
      })
      .returning();

    return this.mapAnalysisRow(saved, {
      edDoc,
      esDoc,
      rawGifDoc,
      segGifDoc,
      segGridEdDoc,
      segGridEsDoc,
    });
  }

  async deleteAnalysis(
    doctorUserId: number,
    patientId: string,
    analysisId: string,
  ) {
    await this.doctorVerifier.verify(doctorUserId);

    const row = await this.db.query.consultationCineMriAnalysis.findFirst({
      where: and(
        eq(consultationCineMriAnalysis.id, analysisId),
        eq(consultationCineMriAnalysis.patientId, patientId),
      ),
    });
    if (!row) throw new NotFoundException('Cine-MRI analysis not found');

    await this.deleteAnalysisRow(analysisId, patientId);
    return { success: true };
  }

  private async deleteAnalysisRow(analysisId: string, patientId: string) {
    const row = await this.db.query.consultationCineMriAnalysis.findFirst({
      where: and(
        eq(consultationCineMriAnalysis.id, analysisId),
        eq(consultationCineMriAnalysis.patientId, patientId),
      ),
    });
    if (!row) return;

    for (const documentId of [
      row.edDocumentId,
      row.esDocumentId,
      row.rawGifDocumentId,
      row.segGifDocumentId,
      row.segGridEdDocumentId,
      row.segGridEsDocumentId,
    ]) {
      if (!documentId) continue;
      const doc = await this.db.query.patientDocument.findFirst({
        where: eq(patientDocument.id, documentId),
      });
      if (doc && isMinioKeyForCategory(doc.s3Key, 'consultation_cine_mri')) {
        await this.minioService.deleteObject(doc.s3Key);
      }
      if (doc) {
        await this.db
          .delete(patientDocument)
          .where(eq(patientDocument.id, doc.id));
      }
    }

    await this.db
      .delete(consultationCineMriAnalysis)
      .where(eq(consultationCineMriAnalysis.id, analysisId));
  }

  private async assertCineMriDocument(
    documentId: string,
    patientId: string,
    kind: 'nifti' | 'image',
  ) {
    const doc = await this.db.query.patientDocument.findFirst({
      where: and(
        eq(patientDocument.id, documentId),
        eq(patientDocument.patientId, patientId),
      ),
    });
    if (!doc) throw new NotFoundException('Document not found');
    if (!isMinioKeyForCategory(doc.s3Key, 'consultation_cine_mri')) {
      throw new BadRequestException('Invalid cine-MRI storage key');
    }

    const fileName = doc.fileName ?? '';
    const contentType = doc.contentType ?? 'application/octet-stream';
    if (kind === 'nifti' && !isNiftiFile(fileName, contentType)) {
      throw new BadRequestException('Expected NIfTI document');
    }
    if (kind === 'image' && !isVisualizationFile(fileName, contentType)) {
      throw new BadRequestException('Expected visualization document');
    }

    const maxBytes =
      kind === 'nifti' ? CINE_MRI_NIFTI_MAX_BYTES : CINE_MRI_IMAGE_MAX_BYTES;
    if (doc.sizeBytes != null && doc.sizeBytes > maxBytes) {
      throw new BadRequestException('Cine-MRI file exceeds allowed size');
    }

    return doc;
  }

  private async mapAnalysisRow(
    row: typeof consultationCineMriAnalysis.$inferSelect,
    docs?: {
      edDoc: typeof patientDocument.$inferSelect;
      esDoc: typeof patientDocument.$inferSelect;
      rawGifDoc: typeof patientDocument.$inferSelect;
      segGifDoc: typeof patientDocument.$inferSelect;
      segGridEdDoc: typeof patientDocument.$inferSelect;
      segGridEsDoc: typeof patientDocument.$inferSelect;
    },
  ) {
    const edDoc =
      docs?.edDoc ??
      (row.edDocumentId
        ? await this.db.query.patientDocument.findFirst({
            where: eq(patientDocument.id, row.edDocumentId),
          })
        : null);
    const esDoc =
      docs?.esDoc ??
      (row.esDocumentId
        ? await this.db.query.patientDocument.findFirst({
            where: eq(patientDocument.id, row.esDocumentId),
          })
        : null);
    const rawGifDoc =
      docs?.rawGifDoc ??
      (row.rawGifDocumentId
        ? await this.db.query.patientDocument.findFirst({
            where: eq(patientDocument.id, row.rawGifDocumentId),
          })
        : null);
    const segGifDoc =
      docs?.segGifDoc ??
      (row.segGifDocumentId
        ? await this.db.query.patientDocument.findFirst({
            where: eq(patientDocument.id, row.segGifDocumentId),
          })
        : null);
    const segGridEdDoc =
      docs?.segGridEdDoc ??
      (row.segGridEdDocumentId
        ? await this.db.query.patientDocument.findFirst({
            where: eq(patientDocument.id, row.segGridEdDocumentId),
          })
        : null);
    const segGridEsDoc =
      docs?.segGridEsDoc ??
      (row.segGridEsDocumentId
        ? await this.db.query.patientDocument.findFirst({
            where: eq(patientDocument.id, row.segGridEsDocumentId),
          })
        : null);

    const analysis = JSON.parse(row.analysisJson) as {
      elapsedSec: number;
      clinicalFeatures: Record<string, number>;
    };

    const [rawGifUrl, segGifUrl, segGridEdUrl, segGridEsUrl] =
      await Promise.all([
        rawGifDoc?.s3Key
          ? this.minioService.createDownloadUrl({ key: rawGifDoc.s3Key })
          : null,
        segGifDoc?.s3Key
          ? this.minioService.createDownloadUrl({ key: segGifDoc.s3Key })
          : null,
        segGridEdDoc?.s3Key
          ? this.minioService.createDownloadUrl({ key: segGridEdDoc.s3Key })
          : null,
        segGridEsDoc?.s3Key
          ? this.minioService.createDownloadUrl({ key: segGridEsDoc.s3Key })
          : null,
      ]);

    return {
      id: row.id,
      patientId: row.patientId,
      consultationId: row.consultationId,
      diagnosisClass: row.diagnosisClass,
      elapsedSec: analysis.elapsedSec ?? 0,
      clinicalFeatures: analysis.clinicalFeatures ?? {},
      createdAt: row.createdAt.toISOString(),
      edDocumentId: row.edDocumentId,
      esDocumentId: row.esDocumentId,
      rawGifDocumentId: row.rawGifDocumentId,
      segGifDocumentId: row.segGifDocumentId,
      segGridEdDocumentId: row.segGridEdDocumentId,
      segGridEsDocumentId: row.segGridEsDocumentId,
      rawGifUrl,
      segGifUrl,
      segGridEdUrl,
      segGridEsUrl,
      edDocument: edDoc
        ? {
            id: edDoc.id,
            fileName: edDoc.fileName,
            contentType: edDoc.contentType,
            sizeBytes: edDoc.sizeBytes,
          }
        : null,
      esDocument: esDoc
        ? {
            id: esDoc.id,
            fileName: esDoc.fileName,
            contentType: esDoc.contentType,
            sizeBytes: esDoc.sizeBytes,
          }
        : null,
    };
  }
}
