CREATE TABLE IF NOT EXISTS "consultation_echo_analysis" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "patient_id" uuid NOT NULL REFERENCES "patient"("id") ON DELETE CASCADE,
  "consultation_id" uuid REFERENCES "consultation"("id") ON DELETE SET NULL,
  "video_document_id" uuid REFERENCES "patient_document"("id") ON DELETE SET NULL,
  "overlay_gif_document_id" uuid REFERENCES "patient_document"("id") ON DELETE SET NULL,
  "frame_viz_document_id" uuid REFERENCES "patient_document"("id") ON DELETE SET NULL,
  "file_name" varchar(255),
  "analysis_json" text NOT NULL,
  "ai_report" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "idx_consultation_echo_patient_created"
  ON "consultation_echo_analysis" ("patient_id", "created_at" DESC);

CREATE INDEX IF NOT EXISTS "idx_consultation_echo_consultation"
  ON "consultation_echo_analysis" ("consultation_id");
