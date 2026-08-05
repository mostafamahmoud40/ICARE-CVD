/**
 * useDocumentUpload - Hook for handling S3 document uploads
 * SOLID Principles:
 * - Single Responsibility: Handles document upload logic only
 * - Dependency Inversion: Depends on apiClient abstraction, not direct API calls
 */

import { useState } from "react";
import { apiClient } from "@/lib/api-client";
import axios from "axios";

export interface S3UploadIntentResult {
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
  const [uploadProgress, setUploadProgress] = useState<{ [fileId: string]: number }>({});
  const [error, setError] = useState<string | null>(null);

  /**
   * Request a presigned URL from backend before uploading to S3
   * Single Responsibility: Get presigned URL for client-side upload
   */
  const getUploadIntent = async (
    fileName: string,
    contentType: string,
    category: string
  ): Promise<S3UploadIntentResult> => {
    try {
      const response = await apiClient.post<S3UploadIntentResult>(
        "/documents/upload-intent",
        {
          fileName,
          contentType,
          category,
        }
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

  /**
   * Upload file directly to S3 using presigned URL
   * Single Responsibility: Handle S3 upload only
   * Handles CORS with proper headers and error recovery
   */
  const uploadToS3 = async (
    fileId: string,
    file: File,
    uploadUrl: string,
    mimeType: string
  ): Promise<void> => {
    setUploading((prev) => ({ ...prev, [fileId]: "uploading" }));

    try {
      // Use Fetch API with proper headers for S3
      // S3 requires Content-Type header to match what was used in presigned URL generation
      const response = await fetch(uploadUrl, {
        method: "PUT",
        body: file,
        headers: {
          "Content-Type": mimeType,
          // Don't set Authorization header - presigned URL includes it
          // Don't set Host header - browser will set it
        },
        // IMPORTANT: Not setting mode: 'cors' on purpose
        // Presigned URLs should work without explicit CORS mode
      });

      if (!response.ok) {
        // For 403 Forbidden (CORS), we need better error message
        if (response.status === 403) {
          console.error(
            `[S3 Upload Error] 403 Forbidden - Possible CORS issue. URL: ${uploadUrl.split('?')[0]}`
          );
          throw new Error(
            "S3 upload rejected (403). Check S3 bucket CORS configuration and verify presigned URL is valid."
          );
        }
        
        const errorText = await response.text();
        throw new Error(
          `S3 upload failed (${response.status}): ${errorText || response.statusText}`
        );
      }

      setUploading((prev) => ({ ...prev, [fileId]: "success" }));
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Upload to S3 failed - Network error or CORS issue";
      
      console.error(`[S3 Upload Error for ${fileId}]:`, {
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

  /**
   * Complete upload workflow: Get intent → Upload to S3 → Return metadata
   * Single Responsibility: Orchestrate upload steps (composition)
   */
  const uploadDocument = async (
    fileId: string,
    file: File,
    category: string
  ): Promise<UploadedDocumentFile> => {
    try {
      setUploading((prev) => ({ ...prev, [fileId]: "preparing" }));
      setError(null);

      // Step 1: Get presigned URL from backend
      const intent = await getUploadIntent(
        file.name,
        file.type || "application/octet-stream",
        category
      );

      // Step 2: Upload file to S3
      await uploadToS3(fileId, file, intent.uploadUrl, file.type || "application/octet-stream");

      // Step 3: Return document metadata for database storage
      const uploadedDoc: UploadedDocumentFile = {
        id: fileId,
        fileName: file.name,
        fileSize: file.size,
        category,
        s3Key: intent.key,
        s3Url: intent.publicUrl || `${window.location.origin}/${intent.key}`,
        mimeType: file.type || "application/octet-stream",
      };

      return uploadedDoc;
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
