## Setup

- Use nvm to install NodeJS (makes it much easier to switch versions)
- NodeJS >= 16 required

In a terminal, run:

- `git config --global core.editor "code --wait"` - It allows to use GitLens interactive rebase client when running rebases from Git Graph (or from the terminal).
- `corepack enable` ([explanation](https://yarnpkg.com/getting-started/install))

## Usage

- With VSCode, `Open Workspace from File...`, select the file `clapy.code-workspace`. **Don't** open the root directory.
- Install the suggested plugins and accept to use the TypeScript workspace version when prompted.
- `yarn install:all` to install dependencies in root and subprojects
- To develop:
  - Build and watch everything: in VS Code: "Run Build Task" command (Ctrl+Shift+B with my keyboard shortcuts) to run the default build task and build everything (1)
  - "Start Debugging" command (F11 with my keyboard shortcuts) to start the debugger for the webservice
- Alternatively, to develop on the webservice only:
  - `yarn up` through command-line to start all docker containers
  - "Start Debugging" command (F11 with my keyboard shortcuts) to start the debugger for the webservice

(1) Alternative: `yarn dev` through command-line to start everything

## Update the database

- Run `hasura console` in a terminal, and open the printed link. From the hasura console, make the desired changes.
- Run `yarn gentypes` to update the TypeScript interface and graphql model in the code base.

Note: for now, the corresponding `Hasura console` task is excluded from the default build because it's rarely useful in current developments. If you find yourself often opening the console, don't hesitate to add the task back to the main task, `Start dev env`, in `.vscode/tasks.json`.

## Generate aggregated analytics for Pipedrive

### Get raw analytics from Metabase

URL: https://clapy-production.ew.r.appspot.com/
Sign in with Google. Clapy emails should be allowed.

To redeploy Metabase, check the instructions in `metabase/README.md`.

### Run the script

TODO Yacine

## Update yarn

- `yarn set version stable`
- `yarn install` in the root, the back and the front directories.

## Update libraries

- `yarn upgr` and select the new versions.

Special mentions:

- Hasura CLI: you need to update the library version + the version of the image hasura/graphql-engine in docker-compose.yml + db/Dockerfile. They all have to have the same version number.
- @types/node: the major version should be the same as the node used in the project
- express-jwt: there used to be a bug in JWT validation when upgrading above 6.1.2. If you upgrade, ensure you test carefully the JWT validation.

Code to design libraries, unused for now:

- opentype.js: it's a fork, no need to upgrade for now (see _Open PR & issues from me_ below)
- puppeteer

## Test Stripe workflow

If an event, sent by Stripe CLI, was not caught locally by the API (e.g. while it was restarting), you can re-send the event.

- Copy the event ID on this page: https://dashboard.stripe.com/test/events
- Open the CLI in the docker container of Stripe CLI (through Docker Desktop UI, "CLI" button)
- Command: `stripe events resend evt_<event ID>`

In production, the events are re-sent, but Stripe CLI (dev) doesn't support it. Issue: https://github.com/stripe/stripe-cli/issues/313

## Troubleshooting

### Switch to production branch

- Arrêter toutes les tâches en cours d'exécution et le webservice si en mode debug
- changer de branche
- yarn install dans les 2 dossiers (front/webservice)
- changer la fin de .env en copiant-collant le template
- webservice : supprimer dist et node_modules/.cache/tsconfig.tsbuildinfo
- Lancer les tâches (ctrl shift B). Ca inclut le webservice.

### `Error: Cannot find module '/app/dist/main2'`

Open a docker container terminal and remove /app/node_modules/.cache/tsconfig.tsbuildinfo

`rm /app/node_modules/.cache/tsconfig.tsbuildinfo`

This must be done inside Docker, because node_modules is in a separate volume.

## Switch backend to script outside webservice

To use main2.ts instead of main.ts, open docker-compose.yml and change the backend command to command: yarn start:docker:debug:main2.

WARN: don't commit this change. It's a convenience to make development easier on features testable outside the webservice.

## Yarn auto-completion

Suggested package: https://github.com/dsifford/yarn-completion
Alternative: https://github.com/mklabs/yarn-completions
Discussion: https://github.com/yarnpkg/yarn/issues/609

## Open PR & issues from me:

PR: https://github.com/opentypejs/opentype.js/pull/503
Fork: https://github.com/antoineol/opentype.js

VS Code debugger : https://github.com/microsoft/vscode/issues/150036

## AST exploration tools

- https://ts-ast-viewer.com/ for typescript AST playground
- https://astexplorer.net/ to list AST tools and play, e.g. CSS AST

## Notes for later

- codesandbox uses parcel to bundle in the browser.
- Puppeteer optimised for concurrent requests: https://stackoverflow.com/questions/57898974/calling-puppeteer-from-rest-api
- If need to hash images, binaries... the lib sha256-uint8array can help. I also tried crypto-js and use sha.js in another context, but they seem bigger/slower.

## Figma plugin tips

Notes to help making a Figma plugin:

- React components using Figma design system (with demo): https://github.com/alexandrtovmach/react-figma-plugin-ds
- List of projects useful for Figma plugin development: https://github.com/thomas-lowry/figma-plugins-on-github

Faster bundling with vitejs:

- https://stackoverflow.com/questions/69585063/vue-js-package-app-as-figma-plugin-using-vite
- https://github.com/vitejs/vite/issues/3314

Another template for figma plugin using iframe for live reload: https://github.com/PluginFinchy/Figma-Vue3-Template/blob/main/livepreview.html

Repo figma-plugin-helpers by a community member in slack: https://github.com/figma-plugin-helper-functions/figma-plugin-helpers

## CSS AST tools

https://github.com/csstree/csstree 20M downloads, 1.4k likes -- good, targetting my use case
https://github.com/postcss/postcss 66M downlaods, 26k likes -- has a parser, but too general purpose, probably too big and harder to use.
https://github.com/reworkcss/css 12M downloads, 1.4k likes -- seems to focus on read, not write

downloads are weekly figures on npmjs.com.

Inspiration to convert figma config to CSS: https://github.com/figma-plugin-helper-functions/figma-plugin-helpers/blob/master/src/helpers/getCSSStyles.ts

## CDN for assets

Uploaded on Cloudinary - Antoine OL account - https://cloudinary.com/console/c-4ef63b1d9baacdff4573fef39c2ef0/media_library/folders/home
