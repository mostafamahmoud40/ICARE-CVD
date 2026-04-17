-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Add notes_embedding column to vital_reading
ALTER TABLE "vital_reading" ADD COLUMN "notes_embedding" vector(384);
