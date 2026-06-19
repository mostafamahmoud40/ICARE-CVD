import { Injectable, InternalServerErrorException } from '@nestjs/common';
import * as crypto from 'crypto';
import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import {
  buildChatConversationPrefix,
  MINIO_CATEGORY_PREFIX,
  MINIO_DEFAULT_PRESIGN_TTL_SECONDS,
} from './minio.constants';
import type {
  MinioDownloadUrlInput,
  MinioUploadIntentInput,
  MinioUploadIntentResult,
} from './minio.types';

@Injectable()
export class MinioService {
  private readonly bucket = process.env.MINIO_BUCKET_NAME;
  private readonly region = process.env.MINIO_REGION ?? 'us-east-1';
  private readonly endpoint = process.env.MINIO_ENDPOINT;
  private readonly presignEndpoint =
    process.env.MINIO_PRESIGN_ENDPOINT || process.env.MINIO_ENDPOINT;
  private readonly publicBaseUrl = process.env.MINIO_PUBLIC_BASE_URL;

  private readonly client = this.buildClient(this.endpoint);
  private readonly presignClient = this.buildClient(this.presignEndpoint);

  private buildClient(endpoint?: string) {
    return new S3Client({
      region: this.region,
      endpoint: endpoint || undefined,
      forcePathStyle: process.env.MINIO_FORCE_PATH_STYLE !== 'false',
      credentials:
        process.env.MINIO_ACCESS_KEY_ID && process.env.MINIO_SECRET_ACCESS_KEY
          ? {
              accessKeyId: process.env.MINIO_ACCESS_KEY_ID,
              secretAccessKey: process.env.MINIO_SECRET_ACCESS_KEY,
            }
          : undefined,
    });
  }

  async createUploadIntent(
    input: MinioUploadIntentInput,
  ): Promise<MinioUploadIntentResult> {
    if (!this.bucket || !this.endpoint) {
      throw new InternalServerErrorException(
        'MinIO is not configured (missing bucket/endpoint).',
      );
    }

    const prefix = this.resolveObjectPrefix(input);
    const key = `${prefix}/${this.buildObjectName(input.fileName, input.contentType)}`;

    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: input.contentType,
    });

    const expiresIn = Number(
      process.env.MINIO_PRESIGN_TTL_SECONDS ?? MINIO_DEFAULT_PRESIGN_TTL_SECONDS,
    );
    const uploadUrl = await getSignedUrl(this.presignClient, command, {
      expiresIn,
    });

    return {
      key,
      uploadUrl,
      publicUrl: this.publicBaseUrl
        ? `${this.publicBaseUrl}/${key}`
        : undefined,
      expiresIn,
    };
  }

  async getObjectStream(key: string) {
    if (!this.bucket || !this.endpoint) {
      throw new InternalServerErrorException(
        'MinIO is not configured (missing bucket/endpoint).',
      );
    }

    const response = await this.client.send(
      new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
      }),
    );

    if (!response.Body) {
      throw new InternalServerErrorException('Attachment file is missing.');
    }

    return {
      body: response.Body,
      contentType: response.ContentType ?? 'application/octet-stream',
      contentLength: response.ContentLength,
    };
  }

  async createDownloadUrl(input: MinioDownloadUrlInput): Promise<string> {
    if (!this.bucket || !this.endpoint) {
      throw new InternalServerErrorException(
        'MinIO is not configured (missing bucket/endpoint).',
      );
    }

    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: input.key,
    });

    const expiresIn = Number(
      process.env.MINIO_PRESIGN_TTL_SECONDS ?? MINIO_DEFAULT_PRESIGN_TTL_SECONDS,
    );

    return getSignedUrl(this.presignClient, command, { expiresIn });
  }

  async deleteObject(key: string): Promise<void> {
    if (!this.bucket || !this.endpoint) {
      throw new InternalServerErrorException(
        'MinIO is not configured (missing bucket/endpoint).',
      );
    }

    await this.client.send(
      new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key,
      }),
    );
  }

  private resolveObjectPrefix(input: MinioUploadIntentInput): string {
    if (input.category === 'lab_report') {
      if (!input.patientId) {
        throw new InternalServerErrorException(
          'patientId is required for lab report uploads.',
        );
      }
      return `${MINIO_CATEGORY_PREFIX.lab_report}/${input.patientId}`;
    }

    if (input.category === 'consultation_xray') {
      if (!input.patientId) {
        throw new InternalServerErrorException(
          'patientId is required for consultation X-ray uploads.',
        );
      }
      return `${MINIO_CATEGORY_PREFIX.consultation_xray}/${input.patientId}`;
    }

    if (input.category === 'consultation_echo') {
      if (!input.patientId) {
        throw new InternalServerErrorException(
          'patientId is required for consultation echo uploads.',
        );
      }
      return `${MINIO_CATEGORY_PREFIX.consultation_echo}/${input.patientId}`;
    }

    if (input.category === 'consultation_ecg') {
      if (!input.patientId) {
        throw new InternalServerErrorException(
          'patientId is required for consultation ECG uploads.',
        );
      }
      return `${MINIO_CATEGORY_PREFIX.consultation_ecg}/${input.patientId}`;
    }

    if (input.conversationId && input.conversationId > 0) {
      return buildChatConversationPrefix(
        input.conversationId,
        input.category as 'chat_image' | 'chat_file',
      );
    }

    return MINIO_CATEGORY_PREFIX[input.category];
  }

  private buildObjectName(fileName: string, contentType: string): string {
    const uuid = crypto.randomUUID();
    const extension = this.resolveExtension(fileName, contentType);
    return extension ? `${uuid}.${extension}` : uuid;
  }

  private resolveExtension(
    fileName: string,
    contentType: string,
  ): string | null {
    const byName = this.getExtensionFromFileName(fileName);
    if (byName) return byName;
    return this.getExtensionFromContentType(contentType);
  }

  private getExtensionFromFileName(fileName: string): string | null {
    const clean = fileName.trim();
    if (!clean || !clean.includes('.')) return null;
    const ext = clean.split('.').pop()?.toLowerCase();
    if (!ext || !/^[a-z0-9]+$/.test(ext)) return null;
    return ext;
  }

  private getExtensionFromContentType(contentType: string): string | null {
    const map: Record<string, string> = {
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'image/webp': 'webp',
      'image/gif': 'gif',
      'video/mp4': 'mp4',
      'video/webm': 'webm',
      'video/quicktime': 'mov',
      'video/x-msvideo': 'avi',
      'video/avi': 'avi',
      'video/x-matroska': 'mkv',
      'application/pdf': 'pdf',
      'text/plain': 'txt',
      'application/zip': 'zip',
      'application/x-zip-compressed': 'zip',
    };
    return map[contentType] ?? null;
  }
}
