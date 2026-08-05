/**
 * useDocumentUpload — presigned MinIO uploads during patient registration.
 */

import { useState } from "react";
import { apiClient } from "@/lib/api-client";
import axios from "axios";

export interface StorageUploadIntentResult {
  key: string;
  uploadUrl: string;
  publicUrl?: string;
  expiresIn: number;
}

export interface UploadedDocumentFile {
  id: string;
  fileName: string;
  fileSize: number;
  category: string;
  s3Key: string;
  s3Url: string;
  mimeType: string;
}

type UploadState = "idle" | "preparing" | "uploading" | "success" | "error";

export function useDocumentUpload() {
  const [uploading, setUploading] = useState<{ [fileId: string]: UploadState }>({});
  const [uploadProgress] = useState<{ [fileId: string]: number }>({});
  const [error, setError] = useState<string | null>(null);

  const getUploadIntent = async (
    fileName: string,
    contentType: string,
    category: string,
  ): Promise<StorageUploadIntentResult> => {
    try {
      const response = await apiClient.post<StorageUploadIntentResult>(
        "/documents/upload-intent",
        {
          fileName,
          contentType,
          category,
        },
      );
      return response.data;
    } catch (err) {
      const message = axios.isAxiosError(err)
        ? err.response?.data?.message || err.message
        : "Failed to get upload URL";
      setError(message);
      throw new Error(message);
    }
  };

  const uploadToStorage = async (
    fileId: string,
    file: File,
    uploadUrl: string,
    mimeType: string,
  ): Promise<void> => {
    setUploading((prev) => ({ ...prev, [fileId]: "uploading" }));

    try {
      const response = await fetch(uploadUrl, {
        method: "PUT",
        body: file,
        headers: {
          "Content-Type": mimeType,
        },
      });

      if (!response.ok) {
        if (response.status === 403) {
          console.error(
            `[MinIO upload] 403 Forbidden — check MinIO CORS. URL: ${uploadUrl.split("?")[0]}`,
          );
          throw new Error(
            "Upload rejected (403). Check MinIO bucket CORS and presigned URL validity.",
          );
        }

        const errorText = await response.text();
        throw new Error(
          `Upload failed (${response.status}): ${errorText || response.statusText}`,
        );
      }

      setUploading((prev) => ({ ...prev, [fileId]: "success" }));
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Upload failed — network error or CORS issue";

      console.error(`[MinIO upload error for ${fileId}]:`, {
        message,
        url: uploadUrl.split("?")[0],
        fileSize: file.size,
        contentType: mimeType,
      });

      setError(message);
      setUploading((prev) => ({ ...prev, [fileId]: "error" }));
      throw new Error(message);
    }
  };

  const uploadDocument = async (
    fileId: string,
    file: File,
    category: string,
  ): Promise<UploadedDocumentFile> => {
    try {
      setUploading((prev) => ({ ...prev, [fileId]: "preparing" }));
      setError(null);

      const intent = await getUploadIntent(
        file.name,
        file.type || "application/octet-stream",
        category,
      );

      await uploadToStorage(
        fileId,
        file,
        intent.uploadUrl,
        file.type || "application/octet-stream",
      );

      return {
        id: fileId,
        fileName: file.name,
        fileSize: file.size,
        category,
        s3Key: intent.key,
        s3Url: intent.publicUrl || `${window.location.origin}/${intent.key}`,
        mimeType: file.type || "application/octet-stream",
      };
    } catch (err) {
      setUploading((prev) => ({ ...prev, [fileId]: "error" }));
      throw err;
    }
  };

  return {
    uploadDocument,
    uploading,
    uploadProgress,
    error,
    clearError: () => setError(null),
  };
}
