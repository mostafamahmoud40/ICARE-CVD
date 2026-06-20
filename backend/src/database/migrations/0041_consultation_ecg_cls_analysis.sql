CREATE TABLE IF NOT EXISTS "consultation_ecg_cls_analysis" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "patient_id" uuid NOT NULL REFERENCES "patient"("id") ON DELETE CASCADE,
  "consultation_id" uuid REFERENCES "consultation"("id") ON DELETE SET NULL,
  "input_source" varchar(16) NOT NULL,
  "image_document_id" uuid REFERENCES "patient_document"("id") ON DELETE SET NULL,
  "hea_document_id" uuid REFERENCES "patient_document"("id") ON DELETE SET NULL,
  "dat_document_id" uuid REFERENCES "patient_document"("id") ON DELETE SET NULL,
  "preview_document_id" uuid REFERENCES "patient_document"("id") ON DELETE SET NULL,
  "file_name" varchar(255),
  "classification_json" text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "idx_consultation_ecg_cls_patient_created"
  ON "consultation_ecg_cls_analysis" ("patient_id", "created_at" DESC);

CREATE INDEX IF NOT EXISTS "idx_consultation_ecg_cls_consultation"
  ON "consultation_ecg_cls_analysis" ("consultation_id");
