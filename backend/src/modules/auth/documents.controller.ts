import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { DocumentService } from './document.service';
import { AccessTokenGuard } from './access-token.guard';

/**
 * DocumentsController handles document-related API endpoints
 * SOLID: Single Responsibility - focused on document HTTP operations
 */
@Controller('documents')
export class DocumentsController {
  constructor(private readonly documentService: DocumentService) {}

  /**
   * Create upload intent (presigned URL) for file upload to S3
   * POST /documents/upload-intent
   * Body: { fileName: string, contentType: string, category: string }
   * Response: { key, uploadUrl, publicUrl, expiresIn }
   */
  @Post('upload-intent')
  @UseGuards(AccessTokenGuard)
  async createUploadIntent(
    @Body() body: { fileName: string; contentType: string; category: string },
  ) {
    return await this.documentService.createUploadIntent(
      body.category,
      body.fileName,
      body.contentType,
    );
  }
}
