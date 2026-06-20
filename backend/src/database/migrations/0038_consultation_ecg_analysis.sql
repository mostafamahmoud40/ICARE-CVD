CREATE TABLE IF NOT EXISTS "consultation_ecg_analysis" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "patient_id" uuid NOT NULL REFERENCES "patient"("id") ON DELETE CASCADE,
  "consultation_id" uuid REFERENCES "consultation"("id") ON DELETE SET NULL,
  "hea_document_id" uuid REFERENCES "patient_document"("id") ON DELETE SET NULL,
  "dat_document_id" uuid REFERENCES "patient_document"("id") ON DELETE SET NULL,
  "record_name" varchar(255),
  "file_name" varchar(255),
  "analysis_json" text NOT NULL,
  "ai_report_json" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "idx_consultation_ecg_patient_created"
  ON "consultation_ecg_analysis" ("patient_id", "created_at" DESC);

CREATE INDEX IF NOT EXISTS "idx_consultation_ecg_consultation"
  ON "consultation_ecg_analysis" ("consultation_id");
