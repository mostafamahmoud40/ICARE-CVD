import { Inject, Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { desc, eq } from 'drizzle-orm';
import { DRIZZLE } from '../../database/drizzle.provider';
import type { Database } from '../../database/drizzle.provider';
import { patientDocument, patient } from '../../database/schema';
import {
  LAB_REPORT_MAX_BYTES,
  LAB_REPORT_MIME_TYPES,
  MINIO_CATEGORY_PREFIX,
} from '../../shared/storage/minio.constants';
import { MinioService } from '../../shared/storage/minio.service';
import { S3Service } from '../../shared/storage/s3.service';
import { DoctorVerifierService } from '../../shared/doctor/doctor-verifier.service';
import type { CreateDocumentDto } from './dto/documents.dto';

function isMinioLabReportKey(key: string): boolean {
  return key.startsWith(`${MINIO_CATEGORY_PREFIX.lab_report}/`);
}

function isConsultationXrayKey(key: string): boolean {
  return key.startsWith(`${MINIO_CATEGORY_PREFIX.consultation_xray}/`);
}

function isConsultationEchoKey(key: string): boolean {
  return key.startsWith(`${MINIO_CATEGORY_PREFIX.consultation_echo}/`);
}

function isConsultationEcgKey(key: string): boolean {
  return key.startsWith(`${MINIO_CATEGORY_PREFIX.consultation_ecg}/`);
}

@Injectable()
export class DoctorDocumentService {
  constructor(
    @Inject(DRIZZLE) private readonly db: Database,
    private readonly s3Service: S3Service,
    private readonly minioService: MinioService,
    private readonly doctorVerifier: DoctorVerifierService,
  ) {}

  async listDocuments(doctorUserId: number, patientId: string) {
    await this.doctorVerifier.verify(doctorUserId);

    const patientRow = await this.db.query.patient.findFirst({
      where: eq(patient.id, patientId),
    });
    if (!patientRow) throw new NotFoundException('Patient not found');

    return this.db.query.patientDocument.findMany({
      where: eq(patientDocument.patientId, patientId),
      orderBy: desc(patientDocument.createdAt),
    });
  }

  async createLabReportUploadIntent(
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
    if (!LAB_REPORT_MIME_TYPES.has(mimeType)) {
      throw new BadRequestException('Unsupported lab report file type');
    }

    return this.minioService.createUploadIntent({
      fileName,
      contentType: mimeType,
      category: 'lab_report',
      patientId,
    });
  }

  async createDocument(
    doctorUserId: number,
    patientId: string,
    dto: CreateDocumentDto,
  ) {
    const doctorRow = await this.doctorVerifier.verify(doctorUserId);

    const patientRow = await this.db.query.patient.findFirst({
      where: eq(patient.id, patientId),
    });
    if (!patientRow) throw new NotFoundException('Patient not found');

    let s3Key: string | undefined = dto.s3Key;
    if (!s3Key) {
      if (dto.category === 'lab_report') {
        const intent = await this.minioService.createUploadIntent({
          category: 'lab_report',
          fileName: dto.fileName,
          contentType: dto.contentType,
          patientId,
        });
        s3Key = intent.key;
      } else {
        const intent = await this.s3Service.createUploadIntent({
          category: dto.category as never,
          fileName: dto.fileName,
          contentType: dto.contentType,
        });
        s3Key = intent.key;
      }
    } else if (
      dto.category === 'lab_report' &&
      !isMinioLabReportKey(s3Key)
    ) {
      throw new BadRequestException('Invalid lab report storage key');
    } else if (
      dto.category === 'imaging' &&
      s3Key &&
      !isConsultationXrayKey(s3Key) &&
      !isConsultationEchoKey(s3Key) &&
      !isConsultationEcgKey(s3Key) &&
      !s3Key.startsWith('documents/')
    ) {
      throw new BadRequestException('Invalid imaging storage key');
    }

    if (
      dto.category === 'lab_report' &&
      dto.fileSize != null &&
      dto.fileSize > LAB_REPORT_MAX_BYTES
    ) {
      throw new BadRequestException('Lab report file exceeds allowed size');
    }

    const [doc] = await this.db
      .insert(patientDocument)
      .values({
        userId: patientRow.userId,
        patientId,
        fileName: dto.fileName,
        contentType: dto.contentType,
        sizeBytes: dto.fileSize,
        category: dto.category,
        title: dto.title,
        uploadedByUserId: doctorRow.userId,
        s3Key,
      })
      .returning();

    return doc;
  }

  async deleteDocument(doctorUserId: number, documentId: string) {
    await this.doctorVerifier.verify(doctorUserId);

    const doc = await this.db.query.patientDocument.findFirst({
      where: eq(patientDocument.id, documentId),
    });
    if (!doc) throw new NotFoundException('Document not found');

    if (isMinioLabReportKey(doc.s3Key)) {
      await this.minioService.deleteObject(doc.s3Key);
    } else if (isConsultationXrayKey(doc.s3Key) || isConsultationEchoKey(doc.s3Key) || isConsultationEcgKey(doc.s3Key)) {
      await this.minioService.deleteObject(doc.s3Key);
    } else {
      await this.s3Service.deleteObject({ key: doc.s3Key });
    }
    await this.db
      .delete(patientDocument)
      .where(eq(patientDocument.id, documentId));

    return { success: true };
  }
}
