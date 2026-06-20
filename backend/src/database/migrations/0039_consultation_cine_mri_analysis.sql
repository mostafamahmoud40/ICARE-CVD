CREATE TABLE IF NOT EXISTS "consultation_cine_mri_analysis" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "patient_id" uuid NOT NULL REFERENCES "patient"("id") ON DELETE CASCADE,
  "consultation_id" uuid REFERENCES "consultation"("id") ON DELETE SET NULL,
  "ed_document_id" uuid REFERENCES "patient_document"("id") ON DELETE SET NULL,
  "es_document_id" uuid REFERENCES "patient_document"("id") ON DELETE SET NULL,
  "raw_gif_document_id" uuid REFERENCES "patient_document"("id") ON DELETE SET NULL,
  "seg_gif_document_id" uuid REFERENCES "patient_document"("id") ON DELETE SET NULL,
  "seg_grid_ed_document_id" uuid REFERENCES "patient_document"("id") ON DELETE SET NULL,
  "seg_grid_es_document_id" uuid REFERENCES "patient_document"("id") ON DELETE SET NULL,
  "diagnosis_class" varchar(8) NOT NULL,
  "analysis_json" text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "idx_consultation_cine_mri_patient_created"
  ON "consultation_cine_mri_analysis" ("patient_id", "created_at" DESC);

CREATE INDEX IF NOT EXISTS "idx_consultation_cine_mri_consultation"
  ON "consultation_cine_mri_analysis" ("consultation_id");
