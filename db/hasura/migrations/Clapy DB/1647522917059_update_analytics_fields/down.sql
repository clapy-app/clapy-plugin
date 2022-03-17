
alter table "clapy"."analytics" alter column "result" set not null;

alter table "clapy"."analytics" drop column "auth0_id"

alter table "clapy"."analytics" rename column "figma_id" to "user_id";
