Recommended approach before commit / deployment to staging:

```bash
yarn hasura:squash --name "migration_name" --from 1647464761013
```

where `1647464761013` is the version number (number at the beginning of the migration directory names).

Source: https://hasura.io/docs/latest/graphql/core/migrations/migrations-setup.html#step-6-squash-migrations-and-add-checkpoints-to-version-control

---

Older approach:

Update the schema with `yarn schema`.

**/!\ ATTENTION** - only squash when all environments have the **exact** same version of the database schema: local, staging and production. If staging or prod is behind local, the diff won't be run on staging/prod which will result in an incomplete database schema (app bugs) and issues when running future migrations (schema requirements not fulfilled).

To squash the schema (merge all migration files into one single file), [steps here](https://blog.hasura.io/resetting-hasura-migrations/). Beware: if the app is already deployed on multiple environments, it may prevent other environments from applying new migrations (unsynchronized migrations).

To apply squash to staging and prod, we need to clear the migration history in hasura database and mark the migration as already run (same as local for both).

---

(older?) alternative: [hasura squash command](https://hasura.io/docs/1.0/graphql/manual/hasura-cli/hasura_migrate_squash.html) (in preview). But it fails on migrations that don't have a `down` filled with more than `[]` (e.g. when `up` is a `drop table`)

---

Connect Hasura to Google Cloud SQL through a UNIX socket

The database URL should look like:

> postgres://dbusername:dbpassword@/dbname?host=/cloudsql/appid:zone:dbname

/cloudsql/appid:zone:dbname being provided by the database dashboard on Google Cloud

(source: https://dev.to/davidoliveira/setup-hasura-at-google-cloud-run-42i8 - search "And now the tricky part" on the page)