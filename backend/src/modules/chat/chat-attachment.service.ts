import { BadRequestException, Injectable } from '@nestjs/common';
import {
  buildChatConversationPrefix,
  CHAT_FILE_MAX_BYTES,
  CHAT_FILE_MIME_TYPES,
  CHAT_IMAGE_MAX_BYTES,
  CHAT_IMAGE_MIME_TYPES,
  MINIO_CATEGORY_PREFIX,
  type MinioStorageCategory,
} from '../../shared/storage/minio.constants';
import { MinioService } from '../../shared/storage/minio.service';
import type { ChatUploadIntentDto } from './dto/send-message.dto';

@Injectable()
export class ChatAttachmentService {
  constructor(private readonly minioService: MinioService) {}

  async createUploadIntent(conversationId: number, dto: ChatUploadIntentDto) {
    const contentType = dto.contentType.trim().toLowerCase();
    const category = this.resolveCategory(dto.attachmentType, contentType);

    return this.minioService.createUploadIntent({
      fileName: dto.fileName,
      contentType,
      category,
      conversationId,
    });
  }

  async resolveDownloadUrl(key: string) {
    return this.minioService.createDownloadUrl({ key });
  }

  async getObjectStream(key: string) {
    return this.minioService.getObjectStream(key);
  }

  async deleteStoredFile(key: string) {
    await this.minioService.deleteObject(key);
  }

  validateUploadedAttachment(
    conversationId: number,
    input: {
    attachmentType: 'image' | 'file';
    mimeType: string;
    sizeBytes: number;
    s3Key: string;
  },
  ) {
    const mimeType = input.mimeType.trim().toLowerCase();
    const category = this.resolveCategory(input.attachmentType, mimeType);
    const expectedPrefix = `${buildChatConversationPrefix(conversationId, category)}/`;
    const legacyPrefix = `${MINIO_CATEGORY_PREFIX[category]}/`;

    if (
      !input.s3Key.startsWith(expectedPrefix) &&
      !input.s3Key.startsWith(legacyPrefix)
    ) {
      throw new BadRequestException('Invalid attachment storage key');
    }

    const maxBytes =
      input.attachmentType === 'image'
        ? CHAT_IMAGE_MAX_BYTES
        : CHAT_FILE_MAX_BYTES;

    if (input.sizeBytes > maxBytes) {
      throw new BadRequestException('Attachment exceeds allowed size');
    }
  }

  private resolveCategory(
    attachmentType: 'image' | 'file',
    mimeType: string,
  ): MinioStorageCategory {
    if (attachmentType === 'image') {
      if (!CHAT_IMAGE_MIME_TYPES.has(mimeType)) {
        throw new BadRequestException('Unsupported image type');
      }
      return 'chat_image';
    }

    if (!CHAT_FILE_MIME_TYPES.has(mimeType)) {
      throw new BadRequestException('Unsupported file type');
    }
    return 'chat_file';
  }
}
