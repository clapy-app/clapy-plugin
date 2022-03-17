CREATE TABLE "clapy"."analytics" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "created_at" timestamptz NOT NULL DEFAULT now(), "user_id" text NOT NULL, "action" text NOT NULL, "result" text NOT NULL, "details" jsonb, PRIMARY KEY ("id") );
CREATE EXTENSION IF NOT EXISTS pgcrypto;
