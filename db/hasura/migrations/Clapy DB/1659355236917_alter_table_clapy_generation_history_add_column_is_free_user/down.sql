-- Could not auto-generate a down migration.
-- Please write an appropriate down migration for the SQL below:
-- alter table "clapy"."generation_history" add column "is_free_user" boolean
--  not null default 'true';
ALTER TABLE "clapy"."generation_history" 
  DROP COLUMN "is_free_user";