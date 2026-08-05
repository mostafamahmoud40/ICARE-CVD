-- Migration: Chat message attachments (MinIO/S3 metadata)

DO $$
BEGIN
  CREATE TYPE "message_attachment_type_enum" AS ENUM ('image', 'file');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "message_attachments" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "message_id" int NOT NULL REFERENCES "messages"("id") ON DELETE CASCADE,
  "file_name" varchar(255) NOT NULL,
  "mime_type" varchar(120) NOT NULL,
  "size_bytes" int NOT NULL,
  "s3_key" varchar(500) NOT NULL,
  "attachment_type" "message_attachment_type_enum" NOT NULL,
  "created_at" timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "message_attachments_message_id_idx"
  ON "message_attachments" ("message_id");
