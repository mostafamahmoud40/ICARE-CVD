ALTER TABLE "patient" ADD COLUMN IF NOT EXISTS "patient_number" varchar(20);

WITH numbered AS (
  SELECT
    id,
    ROW_NUMBER() OVER (ORDER BY created_at ASC, user_id ASC) AS rn
  FROM patient
  WHERE patient_number IS NULL
)
UPDATE patient p
SET patient_number = 'P-' || LPAD(numbered.rn::text, 3, '0')
FROM numbered
WHERE p.id = numbered.id;

ALTER TABLE "patient" ALTER COLUMN "patient_number" SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "patient_patient_number_unique" ON "patient" ("patient_number");

CREATE SEQUENCE IF NOT EXISTS "patient_number_seq";

SELECT setval(
  'patient_number_seq',
  GREATEST(
    (
      SELECT COALESCE(
        MAX(CAST(SUBSTRING(patient_number FROM 3) AS INTEGER)),
        0
      )
      FROM patient
      WHERE patient_number ~ '^P-[0-9]+$'
    ),
    1
  ),
  true
);
