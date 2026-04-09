import { Controller, Post, Body, Headers, UnauthorizedException } from '@nestjs/common';
import { DocumentService } from './document.service';
import { AuthJwtService } from './jwt';

/**
 * DocumentsController handles document-related API endpoints
 * SOLID: Single Responsibility - focused on document HTTP operations
 */
@Controller('documents')
export class DocumentsController {
  constructor(
    private readonly documentService: DocumentService,
    private readonly authJwtService: AuthJwtService,
  ) {}

  /**
   * Create upload intent (presigned URL) for file upload to S3
   * POST /documents/upload-intent
   * Body: { fileName: string, contentType: string, category: string }
   * Response: { key, uploadUrl, publicUrl, expiresIn }
   */
  @Post('upload-intent')
  async createUploadIntent(
    @Headers('authorization') authorization: string | undefined,
    @Body() body: { fileName: string; contentType: string; category: string },
  ) {
    const token = authorization?.startsWith('Bearer ')
      ? authorization.slice('Bearer '.length).trim()
      : undefined;

    if (!token) {
      throw new UnauthorizedException('Missing Bearer token');
    }

    // Verify token (doesn't need to store userId for presigned URL)
    await this.authJwtService.verifyAccessToken(token);

    return await this.documentService.createUploadIntent(
      body.category,
      body.fileName,
      body.contentType,
    );
  }
}
