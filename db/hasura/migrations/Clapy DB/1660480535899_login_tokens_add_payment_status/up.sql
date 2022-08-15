
alter table "clapy"."login_tokens" add column "user_id" text
 null unique;

alter table "clapy"."login_tokens" add column "payment_status" text
 null;
