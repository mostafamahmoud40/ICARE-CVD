CREATE TABLE IF NOT EXISTS "lab_report_panel" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "patient_id" uuid NOT NULL REFERENCES "patient"("id") ON DELETE CASCADE,
  "document_id" uuid REFERENCES "patient_document"("id") ON DELETE SET NULL,
  "consultation_id" uuid REFERENCES "consultation"("id") ON DELETE SET NULL,
  "panel_title" varchar(255),
  "analysis_json" text NOT NULL,
  "summary" text,
  "ordered_by" text,
  "result_at" timestamp with time zone DEFAULT now() NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "idx_lab_report_panel_patient_created"
  ON "lab_report_panel" ("patient_id", "created_at" DESC);

CREATE INDEX IF NOT EXISTS "idx_lab_report_panel_consultation"
  ON "lab_report_panel" ("consultation_id");
