import { Inject, Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { desc, eq } from 'drizzle-orm';
import { DRIZZLE } from '../../database/drizzle.provider';
import type { Database } from '../../database/drizzle.provider';
import { patientDocument, patient } from '../../database/schema';
import {
  LAB_REPORT_MAX_BYTES,
  LAB_REPORT_MIME_TYPES,
} from '../../shared/storage/minio.constants';
import {
  isMinioKeyForCategory,
  isMinioObjectKey,
  type PatientDocumentCategory,
} from '../../shared/storage/minio-patient-path';
import { MinioService } from '../../shared/storage/minio.service';
import { DoctorVerifierService } from '../../shared/doctor/doctor-verifier.service';
import type { CreateDocumentDto } from './dto/documents.dto';

function isMinioLabReportKey(key: string, patientNumber?: string): boolean {
  return isMinioKeyForCategory(key, 'lab_report', patientNumber);
}

function isConsultationImagingKey(key: string, patientNumber?: string): boolean {
  return (
    isMinioKeyForCategory(key, 'consultation_xray', patientNumber) ||
    isMinioKeyForCategory(key, 'consultation_echo', patientNumber) ||
    isMinioKeyForCategory(key, 'consultation_ecg', patientNumber) ||
    isMinioKeyForCategory(key, 'consultation_cine_mri', patientNumber) ||
    isMinioKeyForCategory(key, 'consultation_ct', patientNumber) ||
    isMinioKeyForCategory(key, 'consultation_ecg_cls', patientNumber)
  );
}

@Injectable()
export class DoctorDocumentService {
  constructor(
    @Inject(DRIZZLE) private readonly db: Database,
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

    return this.minioService.createDocumentUploadIntent({
      fileName,
      contentType: mimeType,
      category: 'lab_report',
      patientNumber: patientRow.patientNumber,
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

    let storageKey: string | undefined = dto.s3Key;
    if (!storageKey) {
      const intent = await this.minioService.createDocumentUploadIntent({
        category: dto.category as PatientDocumentCategory,
        fileName: dto.fileName,
        contentType: dto.contentType,
        patientNumber: patientRow.patientNumber,
      });
      storageKey = intent.key;
    } else if (
      dto.category === 'lab_report' &&
      !isMinioLabReportKey(storageKey, patientRow.patientNumber)
    ) {
      throw new BadRequestException('Invalid lab report storage key');
    } else if (
      dto.category === 'imaging' &&
      !isConsultationImagingKey(storageKey, patientRow.patientNumber) &&
      !isMinioObjectKey(storageKey, patientRow.patientNumber)
    ) {
      throw new BadRequestException('Invalid imaging storage key');
    } else if (!isMinioObjectKey(storageKey, patientRow.patientNumber)) {
      throw new BadRequestException('Invalid document storage key');
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
        s3Key: storageKey,
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

    await this.minioService.deleteObject(doc.s3Key);

    await this.db.delete(patientDocument).where(eq(patientDocument.id, documentId));
  }
}
