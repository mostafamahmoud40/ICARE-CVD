import { Injectable } from '@nestjs/common';

import { MINIO_CATEGORY_PREFIX } from './minio.constants';
import { MinioService } from './minio.service';

/**
 * Resolves stored avatar references to browser-loadable URLs.
 * MinIO patient avatars are stored as object keys (or legacy public URLs);
 * private buckets require presigned download URLs.
 */
@Injectable()
export class AvatarUrlResolver {
  constructor(private readonly minioService: MinioService) {}

  extractPatientAvatarKey(avatarUrl: string): string | null {
    const trimmed = avatarUrl.trim();
    if (!trimmed) return null;

    if (trimmed.startsWith(`${MINIO_CATEGORY_PREFIX.patient_avatar}/`)) {
      return trimmed;
    }

    const bucket = process.env.MINIO_BUCKET_NAME?.trim() || 'icare-chat';
    const pathStyle = `/${bucket}/`;
    const pathIndex = trimmed.indexOf(pathStyle);
    if (pathIndex >= 0) {
      return trimmed.slice(pathIndex + pathStyle.length);
    }

    const hostMarker = `${bucket}/`;
    const hostIndex = trimmed.indexOf(hostMarker);
    if (hostIndex >= 0) {
      return trimmed.slice(hostIndex + hostMarker.length);
    }

    return null;
  }

  isMinioPatientAvatar(avatarUrl: string | null | undefined): boolean {
    if (!avatarUrl?.trim()) return false;
    const key = this.extractPatientAvatarKey(avatarUrl.trim());
    return Boolean(
      key?.startsWith(`${MINIO_CATEGORY_PREFIX.patient_avatar}/`),
    );
  }

  async resolve(avatarUrl: string | null | undefined): Promise<string | null> {
    if (!avatarUrl?.trim()) return null;

    const trimmed = avatarUrl.trim();

    if (trimmed.startsWith('/avatars/')) {
      return trimmed;
    }

    const key = this.extractPatientAvatarKey(trimmed);
    if (key?.startsWith(`${MINIO_CATEGORY_PREFIX.patient_avatar}/`)) {
      try {
        return await this.minioService.createDownloadUrl({ key });
      } catch {
        return null;
      }
    }

    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      return trimmed;
    }

    return trimmed;
  }
}
