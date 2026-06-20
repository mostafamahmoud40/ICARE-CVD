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
  consultationCtAnalysis,
  patient,
  patientDocument,
} from '../../database/schema';
import {
  CINE_MRI_IMAGE_MIME_TYPES,
  CINE_MRI_NIFTI_MIME_TYPES,
  CT_NIFTI_MAX_BYTES,
  CT_SLICE_MAX_BYTES,
  MINIO_CATEGORY_PREFIX,
} from '../../shared/storage/minio.constants';
import { MinioService } from '../../shared/storage/minio.service';
import { DoctorVerifierService } from '../../shared/doctor/doctor-verifier.service';
import type { SaveConsultationCtAnalysisDto } from './dto/consultation-ct.dto';

function isConsultationCtKey(key: string): boolean {
  return key.startsWith(`${MINIO_CATEGORY_PREFIX.consultation_ct}/`);
}

function isNiftiFile(fileName: string, contentType: string): boolean {
  const mime = contentType.trim().toLowerCase();
  return (
    /\.nii(\.gz)?$/i.test(fileName) ||
    CINE_MRI_NIFTI_MIME_TYPES.has(mime)
  );
}

function isSliceImage(fileName: string, contentType: string): boolean {
  const mime = contentType.trim().toLowerCase();
  return CINE_MRI_IMAGE_MIME_TYPES.has(mime) || /\.png$/i.test(fileName);
}

@Injectable()
export class ConsultationCtService {
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
    const image = isSliceImage(fileName, mimeType);
    if (!nifti && !image) {
      throw new BadRequestException('Unsupported CT file type');
    }

    const resolvedContentType = image
      ? 'image/png'
      : fileName.toLowerCase().endsWith('.gz')
        ? 'application/gzip'
        : 'application/octet-stream';

    return this.minioService.createUploadIntent({
      fileName,
      contentType: resolvedContentType,
      category: 'consultation_ct',
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

    const conditions = [eq(consultationCtAnalysis.patientId, patientId)];
    if (consultationId) {
      conditions.push(eq(consultationCtAnalysis.consultationId, consultationId));
    }

    const rows = await this.db.query.consultationCtAnalysis.findMany({
      where: and(...conditions),
      orderBy: desc(consultationCtAnalysis.createdAt),
    });

    return Promise.all(rows.map((row) => this.mapAnalysisRow(row)));
  }

  async saveAnalysis(
    doctorUserId: number,
    patientId: string,
    dto: SaveConsultationCtAnalysisDto,
  ) {
    await this.doctorVerifier.verify(doctorUserId);

    const patientRow = await this.db.query.patient.findFirst({
      where: eq(patient.id, patientId),
    });
    if (!patientRow) throw new NotFoundException('Patient not found');

    const sourceDoc = await this.assertCtDocument(
      dto.sourceDocumentId,
      patientId,
      'nifti',
    );
    const maskDoc = await this.assertCtDocument(
      dto.maskDocumentId,
      patientId,
      'nifti',
    );
    const axialDoc = await this.assertCtDocument(
      dto.axialSliceDocumentId,
      patientId,
      'image',
    );
    const coronalDoc = await this.assertCtDocument(
      dto.coronalSliceDocumentId,
      patientId,
      'image',
    );
    const sagittalDoc = await this.assertCtDocument(
      dto.sagittalSliceDocumentId,
      patientId,
      'image',
    );

    if (dto.consultationId) {
      const existing = await this.db.query.consultationCtAnalysis.findFirst({
        where: and(
          eq(consultationCtAnalysis.patientId, patientId),
          eq(consultationCtAnalysis.consultationId, dto.consultationId),
        ),
      });
      if (existing) {
        await this.deleteAnalysisRow(existing.id, patientId);
      }
    }

    const analysisPayload = {
      voxelCount: dto.voxelCount,
      predShape: dto.predShape,
      volumeMl: dto.volumeMl,
      elapsedSec: dto.elapsedSec,
    };

    const [saved] = await this.db
      .insert(consultationCtAnalysis)
      .values({
        patientId,
        consultationId: dto.consultationId,
        sourceDocumentId: dto.sourceDocumentId,
        maskDocumentId: dto.maskDocumentId,
        axialSliceDocumentId: dto.axialSliceDocumentId,
        coronalSliceDocumentId: dto.coronalSliceDocumentId,
        sagittalSliceDocumentId: dto.sagittalSliceDocumentId,
        fileName: dto.fileName ?? sourceDoc.fileName ?? 'CT scan',
        analysisJson: JSON.stringify(analysisPayload),
      })
      .returning();

    return this.mapAnalysisRow(saved, {
      sourceDoc,
      maskDoc,
      axialDoc,
      coronalDoc,
      sagittalDoc,
    });
  }

  async deleteAnalysis(
    doctorUserId: number,
    patientId: string,
    analysisId: string,
  ) {
    await this.doctorVerifier.verify(doctorUserId);

    const row = await this.db.query.consultationCtAnalysis.findFirst({
      where: and(
        eq(consultationCtAnalysis.id, analysisId),
        eq(consultationCtAnalysis.patientId, patientId),
      ),
    });
    if (!row) throw new NotFoundException('CT analysis not found');

    await this.deleteAnalysisRow(analysisId, patientId);
    return { success: true };
  }

  private async deleteAnalysisRow(analysisId: string, patientId: string) {
    const row = await this.db.query.consultationCtAnalysis.findFirst({
      where: and(
        eq(consultationCtAnalysis.id, analysisId),
        eq(consultationCtAnalysis.patientId, patientId),
      ),
    });
    if (!row) return;

    for (const documentId of [
      row.sourceDocumentId,
      row.maskDocumentId,
      row.axialSliceDocumentId,
      row.coronalSliceDocumentId,
      row.sagittalSliceDocumentId,
    ]) {
      if (!documentId) continue;
      const doc = await this.db.query.patientDocument.findFirst({
        where: eq(patientDocument.id, documentId),
      });
      if (doc && isConsultationCtKey(doc.s3Key)) {
        await this.minioService.deleteObject(doc.s3Key);
      }
      if (doc) {
        await this.db
          .delete(patientDocument)
          .where(eq(patientDocument.id, doc.id));
      }
    }

    await this.db
      .delete(consultationCtAnalysis)
      .where(eq(consultationCtAnalysis.id, analysisId));
  }

  private async assertCtDocument(
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
    if (!isConsultationCtKey(doc.s3Key)) {
      throw new BadRequestException('Invalid CT storage key');
    }

    const fileName = doc.fileName ?? '';
    const contentType = doc.contentType ?? 'application/octet-stream';
    if (kind === 'nifti' && !isNiftiFile(fileName, contentType)) {
      throw new BadRequestException('Expected NIfTI document');
    }
    if (kind === 'image' && !isSliceImage(fileName, contentType)) {
      throw new BadRequestException('Expected slice image document');
    }

    const maxBytes = kind === 'nifti' ? CT_NIFTI_MAX_BYTES : CT_SLICE_MAX_BYTES;
    if (doc.sizeBytes != null && doc.sizeBytes > maxBytes) {
      throw new BadRequestException('CT file exceeds allowed size');
    }

    return doc;
  }

  private async mapAnalysisRow(
    row: typeof consultationCtAnalysis.$inferSelect,
    docs?: {
      sourceDoc: typeof patientDocument.$inferSelect;
      maskDoc: typeof patientDocument.$inferSelect;
      axialDoc: typeof patientDocument.$inferSelect;
      coronalDoc: typeof patientDocument.$inferSelect;
      sagittalDoc: typeof patientDocument.$inferSelect;
    },
  ) {
    const sourceDoc =
      docs?.sourceDoc ??
      (row.sourceDocumentId
        ? await this.db.query.patientDocument.findFirst({
            where: eq(patientDocument.id, row.sourceDocumentId),
          })
        : null);
    const maskDoc =
      docs?.maskDoc ??
      (row.maskDocumentId
        ? await this.db.query.patientDocument.findFirst({
            where: eq(patientDocument.id, row.maskDocumentId),
          })
        : null);
    const axialDoc =
      docs?.axialDoc ??
      (row.axialSliceDocumentId
        ? await this.db.query.patientDocument.findFirst({
            where: eq(patientDocument.id, row.axialSliceDocumentId),
          })
        : null);
    const coronalDoc =
      docs?.coronalDoc ??
      (row.coronalSliceDocumentId
        ? await this.db.query.patientDocument.findFirst({
            where: eq(patientDocument.id, row.coronalSliceDocumentId),
          })
        : null);
    const sagittalDoc =
      docs?.sagittalDoc ??
      (row.sagittalSliceDocumentId
        ? await this.db.query.patientDocument.findFirst({
            where: eq(patientDocument.id, row.sagittalSliceDocumentId),
          })
        : null);

    const analysis = JSON.parse(row.analysisJson) as {
      voxelCount: number;
      predShape: number[];
      volumeMl: number;
      elapsedSec: number;
    };

    const [axialUrl, coronalUrl, sagittalUrl, maskUrl] = await Promise.all([
      axialDoc?.s3Key
        ? this.minioService.createDownloadUrl({ key: axialDoc.s3Key })
        : null,
      coronalDoc?.s3Key
        ? this.minioService.createDownloadUrl({ key: coronalDoc.s3Key })
        : null,
      sagittalDoc?.s3Key
        ? this.minioService.createDownloadUrl({ key: sagittalDoc.s3Key })
        : null,
      maskDoc?.s3Key
        ? this.minioService.createDownloadUrl({ key: maskDoc.s3Key })
        : null,
    ]);

    return {
      id: row.id,
      patientId: row.patientId,
      consultationId: row.consultationId,
      fileName: row.fileName,
      voxelCount: analysis.voxelCount ?? 0,
      predShape: analysis.predShape ?? [],
      volumeMl: analysis.volumeMl ?? 0,
      elapsedSec: analysis.elapsedSec ?? 0,
      createdAt: row.createdAt.toISOString(),
      sourceDocumentId: row.sourceDocumentId,
      maskDocumentId: row.maskDocumentId,
      axialSliceDocumentId: row.axialSliceDocumentId,
      coronalSliceDocumentId: row.coronalSliceDocumentId,
      sagittalSliceDocumentId: row.sagittalSliceDocumentId,
      axialUrl,
      coronalUrl,
      sagittalUrl,
      maskUrl,
      sourceDocument: sourceDoc
        ? {
            id: sourceDoc.id,
            fileName: sourceDoc.fileName,
            contentType: sourceDoc.contentType,
            sizeBytes: sourceDoc.sizeBytes,
          }
        : null,
    };
  }
}
