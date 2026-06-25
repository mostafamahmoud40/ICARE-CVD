import { Injectable } from '@nestjs/common';

import {
  isPatientProfileStorageKey,
  PATIENTS_STORAGE_ROOT,
} from './minio-patient-path';
import { isStaffAvatarStorageKey } from './minio-staff-path';
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

    if (isPatientProfileStorageKey(trimmed)) {
      return trimmed.split('?')[0] ?? trimmed;
    }

    if (isStaffAvatarStorageKey(trimmed)) {
      return trimmed.split('?')[0] ?? trimmed;
    }

    const bucket = process.env.MINIO_BUCKET_NAME?.trim() || 'icare-chat';
    const pathStyle = `/${bucket}/`;
    const pathIndex = trimmed.indexOf(pathStyle);
    if (pathIndex >= 0) {
      const key =
        trimmed.slice(pathIndex + pathStyle.length).split('?')[0] ?? null;
      return key &&
        (isPatientProfileStorageKey(key) || isStaffAvatarStorageKey(key))
        ? key
        : null;
    }

    const hostMarker = `${bucket}/`;
    const hostIndex = trimmed.indexOf(hostMarker);
    if (hostIndex >= 0) {
      const key =
        trimmed.slice(hostIndex + hostMarker.length).split('?')[0] ?? null;
      return key &&
        (isPatientProfileStorageKey(key) || isStaffAvatarStorageKey(key))
        ? key
        : null;
    }

    return null;
  }

  isMinioPatientAvatar(avatarUrl: string | null | undefined): boolean {
    if (!avatarUrl?.trim()) return false;
    const key = this.extractPatientAvatarKey(avatarUrl.trim());
    return Boolean(
      key?.startsWith(`${PATIENTS_STORAGE_ROOT}/`) ||
      key?.includes('/profile/'),
    );
  }

  async resolve(avatarUrl: string | null | undefined): Promise<string | null> {
    if (!avatarUrl?.trim()) return null;

    const trimmed = avatarUrl.trim();

    if (trimmed.startsWith('/avatars/')) {
      return trimmed;
    }

    const key = this.extractPatientAvatarKey(trimmed);
    if (key) {
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
