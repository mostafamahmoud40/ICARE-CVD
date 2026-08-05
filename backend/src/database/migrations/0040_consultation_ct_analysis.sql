CREATE TABLE IF NOT EXISTS "consultation_ct_analysis" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "patient_id" uuid NOT NULL REFERENCES "patient"("id") ON DELETE CASCADE,
  "consultation_id" uuid REFERENCES "consultation"("id") ON DELETE SET NULL,
  "source_document_id" uuid REFERENCES "patient_document"("id") ON DELETE SET NULL,
  "mask_document_id" uuid REFERENCES "patient_document"("id") ON DELETE SET NULL,
  "axial_slice_document_id" uuid REFERENCES "patient_document"("id") ON DELETE SET NULL,
  "coronal_slice_document_id" uuid REFERENCES "patient_document"("id") ON DELETE SET NULL,
  "sagittal_slice_document_id" uuid REFERENCES "patient_document"("id") ON DELETE SET NULL,
  "file_name" varchar(255),
  "analysis_json" text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "idx_consultation_ct_patient_created"
  ON "consultation_ct_analysis" ("patient_id", "created_at" DESC);

CREATE INDEX IF NOT EXISTS "idx_consultation_ct_consultation"
  ON "consultation_ct_analysis" ("consultation_id");
