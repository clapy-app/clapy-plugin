
-- Could not auto-generate a down migration.
-- Please write an appropriate down migration for the SQL below:
-- alter table "clapy"."generation_history" add column "figma_config" jsonb
--  null;
ALTER TABLE "clapy"."generation_history" 
  DROP COLUMN "figma_config";
DROP INDEX IF EXISTS "clapy"."created_at_index";

DROP INDEX IF EXISTS "clapy"."generated_link_index";
