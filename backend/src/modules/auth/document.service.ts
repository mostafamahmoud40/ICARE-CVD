import { Injectable, BadRequestException } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { eq, and } from 'drizzle-orm';
import { DRIZZLE } from '../../database/drizzle.provider';
import type { Database } from '../../database/drizzle.provider';
import { patientDocument } from '../../database/schema';
import { MinioService } from '../../shared/storage/minio.service';
import type { PatientDocumentCategory } from '../../shared/storage/minio-patient-path';

@Injectable()
export class DocumentService {
  constructor(
    @Inject(DRIZZLE) private readonly db: Database,
    private readonly minioService: MinioService,
  ) {}

  async createUploadIntent(
    category: string,
    fileName: string,
    contentType: string,
  ) {
    if (!fileName || !contentType) {
      throw new BadRequestException('fileName and contentType are required');
    }

    const validCategories: PatientDocumentCategory[] = [
      'lab_report',
      'imaging',
      'ecg',
      'prescription',
      'referral',
      'other',
    ];
    if (!validCategories.includes(category as PatientDocumentCategory)) {
      throw new BadRequestException(`Invalid category: ${category}`);
    }

    return this.minioService.createDocumentUploadIntent({
      category: category as PatientDocumentCategory,
      fileName,
      contentType,
    });
  }

  async saveDocumentMetadata(payload: {
    userId: number;
    fileName: string;
    fileSize: number;
    category:
      | 'lab_report'
      | 'imaging'
      | 'ecg'
      | 'prescription'
      | 'referral'
      | 'other';
    s3Key: string;
    mimeType: string;
  }) {
    const inserted = await this.db
      .insert(patientDocument)
      .values({
        userId: payload.userId,
        fileName: payload.fileName,
        sizeBytes: payload.fileSize,
        category: payload.category,
        s3Key: payload.s3Key,
        contentType: payload.mimeType,
      })
      .returning({
        id: patientDocument.id,
        fileName: patientDocument.fileName,
        category: patientDocument.category,
        s3Key: patientDocument.s3Key,
      });

    return inserted[0];
  }

  async getUserDocuments(userId: number) {
    return await this.db.query.patientDocument.findMany({
      where: eq(patientDocument.userId, userId),
    });
  }

  async deleteDocument(userId: number, documentId: string) {
    const doc = await this.db.query.patientDocument.findFirst({
      where: and(
        eq(patientDocument.id, documentId),
        eq(patientDocument.userId, userId),
      ),
    });

    if (!doc) {
      throw new BadRequestException('Document not found');
    }

    await this.minioService.deleteObject(doc.s3Key);

    await this.db
      .delete(patientDocument)
      .where(eq(patientDocument.id, documentId));

    return { success: true };
  }
}
