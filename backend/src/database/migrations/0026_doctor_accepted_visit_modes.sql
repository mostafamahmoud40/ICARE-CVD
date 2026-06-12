ALTER TABLE "doctor" ADD COLUMN IF NOT EXISTS "accepted_visit_modes" varchar(16) DEFAULT 'both' NOT NULL;
