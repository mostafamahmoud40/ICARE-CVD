import { Injectable, BadRequestException } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { eq, and } from 'drizzle-orm';
import { DRIZZLE } from '../../database/drizzle.provider';
import type { Database } from '../../database/drizzle.provider';
import { patientDocument } from '../../database/schema';
import { S3Service } from '../../shared/storage/s3.service';
import type { S3UploadIntentInput } from '../../shared/storage/s3.types';

/**
 * DocumentService handles document-related business logic
 * Responsibility: Document metadata management and orchestration with S3
 * SOLID: Single Responsibility - focused on document operations
 */
@Injectable()
export class DocumentService {
  constructor(
    @Inject(DRIZZLE) private readonly db: Database,
    private readonly s3Service: S3Service,
  ) {}

  /**
   * Create a presigned upload URL for a document file
   * SOLID: Single Responsibility - abstraction over S3 operations
   */
  async createUploadIntent(
    category: string,
    fileName: string,
    contentType: string,
  ) {
    if (!fileName || !contentType) {
      throw new BadRequestException('fileName and contentType are required');
    }

    // Validate category
    const validCategories = ['lab_report', 'imaging', 'ecg', 'prescription', 'other'];
    if (!validCategories.includes(category)) {
      throw new BadRequestException(`Invalid category: ${category}`);
    }

    const input: S3UploadIntentInput = {
      category: category as any,
      fileName,
      contentType,
    };

    return await this.s3Service.createUploadIntent(input);
  }

  /**
   * Save document metadata to database
   * SOLID: Interface Segregation - focused method for one operation
   */
  async saveDocumentMetadata(payload: {
    userId: number;
    fileName: string;
    fileSize: number;
    category: string;
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

  /**
   * Get user documents
   * SOLID: Open/Closed - can be extended for filtering without modification
   */
  async getUserDocuments(userId: number) {
    return await this.db.query.patientDocument.findMany({
      where: eq(patientDocument.userId, userId),
    });
  }

  /**
   * Delete a document from database and S3
   * SOLID: Single Responsibility - handles both operations through S3Service
   */
  async deleteDocument(userId: number, documentId: string) {
    const doc = await this.db.query.patientDocument.findFirst({
      where: and(
        eq(patientDocument.id, documentId),
        eq(patientDocument.userId, userId)
      ),
    });

    if (!doc) {
      throw new BadRequestException('Document not found');
    }

    // Delete from S3
    await this.s3Service.deleteObject({ key: doc.s3Key });

    // Delete from database
    await this.db
      .delete(patientDocument)
      .where(eq(patientDocument.id, documentId));

    return { success: true };
  }
}

