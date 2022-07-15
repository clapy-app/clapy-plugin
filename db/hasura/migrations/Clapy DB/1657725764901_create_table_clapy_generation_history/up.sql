CREATE TABLE "clapy"."generation_history" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "auth0id" text NOT NULL, "created_at" timestamptz NOT NULL DEFAULT now(), "generated_link" text NOT NULL, PRIMARY KEY ("id") );
CREATE EXTENSION IF NOT EXISTS pgcrypto;
