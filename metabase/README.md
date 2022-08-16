## Usage

To (re)deploy Metabase in App Engine:

- Install the Google Cloud CLI: https://cloud.google.com/sdk/docs/install#deb
- Prepare `env_variables.yaml` following the instructions in `env_variables.template.yaml`
- `yarn deploy`

Deployed on https://clapy-production.ew.r.appspot.com/

## Upgrade Metabase

- Get the link of the latest JAR at https://www.metabase.com/start/oss/jar.html
- Replace the link in the `deploy` script in package.json
- `yarn deploy`

## Others

app.yaml ref: https://cloud.google.com/appengine/docs/standard/java-gen2/config/appref?hl=fr#handlers_element
Deployment instructions inspired from https://cloud.google.com/appengine/docs/standard/java-gen2/testing-and-deploying-your-app#other_deployment_options
Old URL: https://clapy-bi.herokuapp.com/

### Old maintenance instructions for Metabase on Heroku

If the Heroku database needs to be emptied:

- Get the database credentials: connect to the Heroku dashboard. Heroku credentials are on the [Practical information document](https://docs.google.com/document/d/1a21chBYSPKCQzYsQscQmhrtcaGSN0HSoTbiLkVKuGP8). Ask Antoine for 2FA. Then, in `Settings`, click `Reveal Config Vars` and copy the value of `DATABASE_URL`. It is in the format `postgres://username:password@hostname:port/maintenancedatabase`.
- Locally, `yarn dup pgadmin` to start pgAdmin, then open its UI from Docker Desktop. Credentials are in `.env`, variables `PGADMIN_DEFAULT_EMAIL` and `PGADMIN_DEFAULT_PASSWORD`.
- Right-click Servers > Register > Server...
- Name: whatever you want (e.g. Metabase prod). In Connection tab, fill the `hostname`, `port`, `maintenancedatabase`, `username`, `password`.
- Expand the database > Databases > find your database with the name matching `maintenancedatabase`. Tip: it is sorted alphabetically, and is likely at the 2/3.
- Databases that can be safely truncated: query_execution and task_history

To list the number of rows for all tables, see the SQL request in db/sql-list-hasura-tables-rows.sql. To run it in pgAdmin, right-click the public schema > Query Tool, then paste the query and run.

Old: The Heroku app can be maintained alive/awake (no idling) by http://kaffeine.herokuapp.com/.
