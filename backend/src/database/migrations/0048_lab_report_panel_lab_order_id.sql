ALTER TABLE "lab_report_panel"
  ADD COLUMN IF NOT EXISTS "lab_order_id" uuid REFERENCES "lab_order"("id") ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS "idx_lab_report_panel_lab_order"
  ON "lab_report_panel" ("lab_order_id");
