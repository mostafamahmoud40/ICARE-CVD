CREATE TABLE IF NOT EXISTS "consultation_xray_analysis" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "patient_id" uuid NOT NULL REFERENCES "patient"("id") ON DELETE CASCADE,
  "consultation_id" uuid REFERENCES "consultation"("id") ON DELETE SET NULL,
  "original_document_id" uuid REFERENCES "patient_document"("id") ON DELETE SET NULL,
  "annotated_document_id" uuid REFERENCES "patient_document"("id") ON DELETE SET NULL,
  "file_name" varchar(255),
  "risk_level" text NOT NULL DEFAULT 'normal',
  "analysis_json" text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "idx_consultation_xray_patient_created"
  ON "consultation_xray_analysis" ("patient_id", "created_at" DESC);

CREATE INDEX IF NOT EXISTS "idx_consultation_xray_consultation"
  ON "consultation_xray_analysis" ("consultation_id");
