

CREATE  INDEX "generated_link_index" on
  "clapy"."generation_history" using btree ("generated_link");

CREATE  INDEX "created_at_index" on
  "clapy"."generation_history" using btree ("created_at");

alter table "clapy"."generation_history" add column "figma_config" jsonb
 null;

alter table "clapy"."generation_history" alter column "generated_link" drop not null;
