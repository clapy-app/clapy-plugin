
CREATE TABLE "clapy"."login_tokens" ("id" serial NOT NULL, "read_token" text, "write_token" text, PRIMARY KEY ("id") );

alter table "clapy"."login_tokens" add constraint "login_tokens_read_token_key" unique ("read_token");

alter table "clapy"."login_tokens" add constraint "login_tokens_write_token_key" unique ("write_token");

alter table "clapy"."login_tokens" add column "code" text
 null;
