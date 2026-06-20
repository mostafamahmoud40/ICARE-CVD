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
  consultationEcgClsAnalysis,
  patient,
  patientDocument,
} from '../../database/schema';
import {
  ECG_CLS_IMAGE_MAX_BYTES,
  ECG_FILE_MAX_BYTES,
  ECG_FILE_MIME_TYPES,
  MINIO_CATEGORY_PREFIX,
  XRAY_IMAGE_MIME_TYPES,
} from '../../shared/storage/minio.constants';
import { MinioService } from '../../shared/storage/minio.service';
import { DoctorVerifierService } from '../../shared/doctor/doctor-verifier.service';
import type { SaveConsultationEcgClsAnalysisDto } from './dto/consultation-ecg-cls.dto';

function isConsultationEcgClsKey(key: string): boolean {
  return key.startsWith(`${MINIO_CATEGORY_PREFIX.consultation_ecg_cls}/`);
}

function isEcgClsImage(fileName: string, contentType: string): boolean {
  const mime = contentType.trim().toLowerCase();
  return (
    XRAY_IMAGE_MIME_TYPES.has(mime) ||
    /\.(png|jpe?g|webp|bmp)$/i.test(fileName)
  );
}

function isWfdbFile(fileName: string): boolean {
  const lower = fileName.toLowerCase();
  return lower.endsWith('.hea') || lower.endsWith('.dat');
}

@Injectable()
export class ConsultationEcgClsService {
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

    const mime = contentType.trim().toLowerCase();
    const image = isEcgClsImage(fileName, mime);
    const wfdb = isWfdbFile(fileName);

    if (!image && !wfdb) {
      throw new BadRequestException(
        'Upload must be an ECG image (PNG/JPG) or WFDB .hea/.dat file',
      );
    }

    const resolvedContentType = image
      ? mime.startsWith('image/')
        ? mime
        : 'image/png'
      : ECG_FILE_MIME_TYPES.has(mime)
        ? mime
        : 'application/octet-stream';

    return this.minioService.createUploadIntent({
      fileName,
      contentType: resolvedContentType,
      category: 'consultation_ecg_cls',
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

    const conditions = [eq(consultationEcgClsAnalysis.patientId, patientId)];
    if (consultationId) {
      conditions.push(
        eq(consultationEcgClsAnalysis.consultationId, consultationId),
      );
    }

    const rows = await this.db.query.consultationEcgClsAnalysis.findMany({
      where: and(...conditions),
      orderBy: desc(consultationEcgClsAnalysis.createdAt),
    });

    return Promise.all(rows.map((row) => this.mapAnalysisRow(row)));
  }

  async saveAnalysis(
    doctorUserId: number,
    patientId: string,
    dto: SaveConsultationEcgClsAnalysisDto,
  ) {
    await this.doctorVerifier.verify(doctorUserId);

    const patientRow = await this.db.query.patient.findFirst({
      where: eq(patient.id, patientId),
    });
    if (!patientRow) throw new NotFoundException('Patient not found');

    if (dto.inputSource === 'image') {
      if (!dto.imageDocumentId) {
        throw new BadRequestException('imageDocumentId is required');
      }
      await this.assertDocument(dto.imageDocumentId, patientId, 'image');
    } else {
      if (!dto.heaDocumentId || !dto.datDocumentId) {
        throw new BadRequestException('heaDocumentId and datDocumentId are required');
      }
      await this.assertDocument(dto.heaDocumentId, patientId, 'wfdb');
      await this.assertDocument(dto.datDocumentId, patientId, 'wfdb');
    }

    let previewDoc: typeof patientDocument.$inferSelect | null = null;
    if (dto.previewDocumentId) {
      previewDoc = await this.assertDocument(
        dto.previewDocumentId,
        patientId,
        'image',
      );
    }

    if (dto.consultationId) {
      const existing = await this.db.query.consultationEcgClsAnalysis.findFirst(
        {
          where: and(
            eq(consultationEcgClsAnalysis.patientId, patientId),
            eq(consultationEcgClsAnalysis.consultationId, dto.consultationId),
          ),
        },
      );
      if (existing) {
        await this.deleteAnalysisRow(existing.id, patientId);
      }
    }

    const [saved] = await this.db
      .insert(consultationEcgClsAnalysis)
      .values({
        patientId,
        consultationId: dto.consultationId,
        inputSource: dto.inputSource,
        imageDocumentId: dto.imageDocumentId ?? null,
        heaDocumentId: dto.heaDocumentId ?? null,
        datDocumentId: dto.datDocumentId ?? null,
        previewDocumentId: dto.previewDocumentId ?? null,
        fileName: dto.fileName ?? 'ECG classification',
        classificationJson: JSON.stringify(dto.classification),
      })
      .returning();

    return this.mapAnalysisRow(saved, { previewDoc });
  }

  async deleteAnalysis(
    doctorUserId: number,
    patientId: string,
    analysisId: string,
  ) {
    await this.doctorVerifier.verify(doctorUserId);

    const row = await this.db.query.consultationEcgClsAnalysis.findFirst({
      where: and(
        eq(consultationEcgClsAnalysis.id, analysisId),
        eq(consultationEcgClsAnalysis.patientId, patientId),
      ),
    });
    if (!row) throw new NotFoundException('ECG classification not found');

    await this.deleteAnalysisRow(analysisId, patientId);
    return { success: true };
  }

  private async deleteAnalysisRow(analysisId: string, patientId: string) {
    const row = await this.db.query.consultationEcgClsAnalysis.findFirst({
      where: and(
        eq(consultationEcgClsAnalysis.id, analysisId),
        eq(consultationEcgClsAnalysis.patientId, patientId),
      ),
    });
    if (!row) return;

    for (const documentId of [
      row.imageDocumentId,
      row.heaDocumentId,
      row.datDocumentId,
      row.previewDocumentId,
    ]) {
      if (!documentId) continue;
      const doc = await this.db.query.patientDocument.findFirst({
        where: eq(patientDocument.id, documentId),
      });
      if (doc && isConsultationEcgClsKey(doc.s3Key)) {
        await this.minioService.deleteObject(doc.s3Key);
      }
      if (doc) {
        await this.db
          .delete(patientDocument)
          .where(eq(patientDocument.id, doc.id));
      }
    }

    await this.db
      .delete(consultationEcgClsAnalysis)
      .where(eq(consultationEcgClsAnalysis.id, analysisId));
  }

  private async assertDocument(
    documentId: string,
    patientId: string,
    kind: 'image' | 'wfdb',
  ) {
    const doc = await this.db.query.patientDocument.findFirst({
      where: and(
        eq(patientDocument.id, documentId),
        eq(patientDocument.patientId, patientId),
      ),
    });
    if (!doc) throw new NotFoundException('Document not found');
    if (!isConsultationEcgClsKey(doc.s3Key)) {
      throw new BadRequestException('Invalid ECG classification storage key');
    }

    const fileName = doc.fileName ?? '';
    const contentType = doc.contentType ?? 'application/octet-stream';
    if (kind === 'image' && !isEcgClsImage(fileName, contentType)) {
      throw new BadRequestException('Expected image document');
    }
    if (kind === 'wfdb' && !isWfdbFile(fileName)) {
      throw new BadRequestException('Expected WFDB document');
    }

    const maxBytes =
      kind === 'image' ? ECG_CLS_IMAGE_MAX_BYTES : ECG_FILE_MAX_BYTES;
    if (doc.sizeBytes != null && doc.sizeBytes > maxBytes) {
      throw new BadRequestException('File exceeds allowed size');
    }

    return doc;
  }

  private async mapAnalysisRow(
    row: typeof consultationEcgClsAnalysis.$inferSelect,
    docs?: { previewDoc: typeof patientDocument.$inferSelect | null },
  ) {
    const imageDoc = row.imageDocumentId
      ? await this.db.query.patientDocument.findFirst({
          where: eq(patientDocument.id, row.imageDocumentId),
        })
      : null;
    const heaDoc = row.heaDocumentId
      ? await this.db.query.patientDocument.findFirst({
          where: eq(patientDocument.id, row.heaDocumentId),
        })
      : null;
    const datDoc = row.datDocumentId
      ? await this.db.query.patientDocument.findFirst({
          where: eq(patientDocument.id, row.datDocumentId),
        })
      : null;
    const previewDoc =
      docs?.previewDoc ??
      (row.previewDocumentId
        ? await this.db.query.patientDocument.findFirst({
            where: eq(patientDocument.id, row.previewDocumentId),
          })
        : null);

    const classification = JSON.parse(
      row.classificationJson,
    ) as Record<string, unknown>;

    const previewUrl = previewDoc?.s3Key
      ? await this.minioService.createDownloadUrl({ key: previewDoc.s3Key })
      : null;
    const imageUrl =
      row.inputSource === 'image' && imageDoc?.s3Key
        ? await this.minioService.createDownloadUrl({ key: imageDoc.s3Key })
        : null;

    return {
      id: row.id,
      patientId: row.patientId,
      consultationId: row.consultationId,
      inputSource: row.inputSource,
      fileName: row.fileName,
      classification,
      createdAt: row.createdAt.toISOString(),
      previewUrl,
      imageUrl,
      imageDocumentId: row.imageDocumentId,
      heaDocumentId: row.heaDocumentId,
      datDocumentId: row.datDocumentId,
      previewDocumentId: row.previewDocumentId,
      imageDocument: imageDoc
        ? {
            id: imageDoc.id,
            fileName: imageDoc.fileName,
            contentType: imageDoc.contentType,
            sizeBytes: imageDoc.sizeBytes,
          }
        : null,
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
