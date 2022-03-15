

alter table "clapy"."analytics" rename column "user_id" to "figma_id";

alter table "clapy"."analytics" add column "auth0_id" text
 null;

alter table "clapy"."analytics" alter column "result" drop not null;
