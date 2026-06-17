CREATE TABLE IF NOT EXISTS "notification" (
  "id" serial PRIMARY KEY NOT NULL,
  "user_id" integer NOT NULL REFERENCES "user"("id") ON DELETE cascade,
  "kind" text NOT NULL,
  "title" text,
  "body" text NOT NULL,
  "href" text,
  "read" boolean DEFAULT false NOT NULL,
  "metadata" jsonb,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "notification_user_id_idx" ON "notification" ("user_id");
CREATE INDEX IF NOT EXISTS "notification_user_read_idx" ON "notification" ("user_id", "read");

CREATE TABLE IF NOT EXISTS "push_subscription" (
  "id" serial PRIMARY KEY NOT NULL,
  "user_id" integer NOT NULL REFERENCES "user"("id") ON DELETE cascade,
  "endpoint" text NOT NULL UNIQUE,
  "p256dh" text NOT NULL,
  "auth" text NOT NULL,
  "user_agent" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "push_subscription_user_id_idx" ON "push_subscription" ("user_id");
