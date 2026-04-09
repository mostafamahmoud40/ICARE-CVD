import { Injectable, InternalServerErrorException } from '@nestjs/common';
import * as crypto from 'crypto';
import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import {
  S3_CATEGORY_PREFIX,
  S3_DEFAULT_PRESIGN_TTL_SECONDS,
} from './s3.constants';
import type {
  S3DeleteInput,
  S3UploadIntentInput,
  S3UploadIntentResult,
} from './s3.types';

@Injectable()
export class S3Service {
  private readonly bucket = process.env.S3_BUCKET_NAME;
  private readonly region = process.env.S3_REGION;
  private readonly endpoint = process.env.S3_ENDPOINT;
  private readonly publicBaseUrl = process.env.S3_PUBLIC_BASE_URL;

  private readonly client = new S3Client({
    region: this.region,
    endpoint: this.endpoint || undefined,
    forcePathStyle: process.env.S3_FORCE_PATH_STYLE === 'true',
    credentials:
      process.env.S3_ACCESS_KEY_ID && process.env.S3_SECRET_ACCESS_KEY
        ? {
            accessKeyId: process.env.S3_ACCESS_KEY_ID,
            secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
          }
        : undefined,
  });

  async createUploadIntent(
    input: S3UploadIntentInput,
  ): Promise<S3UploadIntentResult> {
    if (!this.bucket || !this.region) {
      throw new InternalServerErrorException(
        'S3 is not configured (missing bucket/region).',
      );
    }

    const key = `${S3_CATEGORY_PREFIX[input.category]}/${this.buildObjectName(input.fileName, input.contentType)}`;

    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: input.contentType,
    });

    const expiresIn = Number(
      process.env.S3_PRESIGN_TTL_SECONDS ?? S3_DEFAULT_PRESIGN_TTL_SECONDS,
    );
    const uploadUrl = await getSignedUrl(this.client, command, { expiresIn });

    return {
      key,
      uploadUrl,
      publicUrl: this.publicBaseUrl ? `${this.publicBaseUrl}/${key}` : undefined,
      expiresIn,
    };
  }

  async deleteObject(input: S3DeleteInput): Promise<void> {
    if (!this.bucket) {
      throw new InternalServerErrorException('S3 bucket is not configured.');
    }

    await this.client.send(
      new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: input.key,
      }),
    );
  }

  private buildObjectName(fileName: string, contentType: string): string {
    const uuid = crypto.randomUUID();
    const extension = this.resolveExtension(fileName, contentType);
    return extension ? `${uuid}.${extension}` : uuid;
  }

  private resolveExtension(fileName: string, contentType: string): string | null {
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
      'application/pdf': 'pdf',
      'text/plain': 'txt',
    };
    return map[contentType] ?? null;
  }
}
