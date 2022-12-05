# [Clapy](https://docs.clapy.co/)

> Clapy is a Figma plugin that generates React and Angular components and pages from your Figma design.

For usage, please refer to [the documentation](https://docs.clapy.co/) or [our website](https://clapy.co/).

This readme describes how to get started with the source code. The below instructions are opinionated, initially written for our internal team.

The Figma plugin sources also show an example about how we could have a relatively good developer experiences compared to alternative templates available out there.

- Preview in the browser (In dev mode, the plugin is split in 2 parts: the front in the browser and the back in Figma, as plugin. They communicate through websockets)
- Hot-reload the front with vitejs (super fast)
- build with esbuild (super fast)
- Example of authentication with Auth0 (the token management can be improved when signing in)
- ...

## Setup

- Use nvm to install NodeJS (makes it much easier to switch versions)
- NodeJS >= 16 required
- yarn (`npm install -g yarn`)
- If you're on Windows, 16 GB of RAM
  - you may want to cap the memory consumption of WSL2 to 4.5 or 5 GB. Feel free to tune it. https://github.com/microsoft/WSL/issues/4166#issuecomment-526725261

In a terminal, run:

- `git config --global core.editor "code --wait"` - It allows to use GitLens interactive rebase client when running rebases from Git Graph (or from the terminal).
- `corepack enable` then `corepack prepare yarn@stable --activate` to install yarn ([explanation](https://yarnpkg.com/getting-started/install))

First usage of git? Also run (replace with your name/email):

  git config --global user.email "you@example.com"
  git config --global user.name "Your Name"

## Usage

- We use a VSCode workspace. With VSCode, `Open Workspace from File...`, select the file `clapy.code-workspace`. **Don't** open the root directory.
- Required: Install the suggested plugins and accept to use the TypeScript workspace version when prompted.
- `yarn install` in the root directory
- To develop:
  - Build and watch everything: in VS Code: "Run Build Task" command (Ctrl+Shift+B with my keyboard shortcuts) to run the default build task and build everything (1)
  - "Start Debugging" command (F11 with my keyboard shortcuts) to start the debugger for the webservice
- Alternatively, to develop on the webservice only:
  - `yarn dup` through command-line to start all docker containers (like `docker-compose up -d`)
  - "Start Debugging" command (F11 with my keyboard shortcuts) to start the debugger for the webservice

(1) Alternative: `yarn dev` through command-line to start everything

## Apply updates to the database

- Run `hasura console` in a terminal, and open the printed link. From the hasura console, make the desired changes.
- Run `yarn gentypes` to update the TypeScript interface and graphql model in the code base.

Note: for now, the corresponding `Hasura console` task is excluded from the default build because it's rarely useful in current developments. If you find yourself often opening the console, don't hesitate to add the task back to the main task, `Start dev env`, in `.vscode/tasks.json`.

## Updates

### Update yarn

- `yarn set version stable`
- `yarn dlx @yarnpkg/sdks vscode` may be required when upgrading typescript, so that VSCode typescript workspace version is also updated.
- `yarn install` in the root (and the back and the front?) directories.

### Update libraries

- `yarn upgr` and select the new versions.

Special mentions:

- Hasura CLI: you need to update the library version + the version of the image hasura/graphql-engine in docker-compose.yml + db/Dockerfile. They all have to have the same version number.
- @types/node: the major version should be the same as the node used in the project

"Code-to-design" libraries (the old Clapy), unused for now:

- opentype.js: it's a fork, no need to upgrade for now (see _Open PR & issues from me_ below)
- puppeteer

### Update Hasura

See [db/README.md](db/README.md)

## Open pgAdmin

- Get your database credentials.
- Locally, `yarn dup pgadmin` to start pgAdmin, then open its UI from Docker Desktop. Credentials are in `.env`, variables `PGADMIN_DEFAULT_EMAIL` and `PGADMIN_DEFAULT_PASSWORD`.
- Right-click Servers > Register > Server...
- Name: whatever you want (e.g. Metabase prod). In Connection tab, fill the `hostname`, `port`, `maintenancedatabase`, `username`, `password`.

## Troubleshooting

### `Error: Cannot find module '/app/dist/main2'`

Open a docker container terminal and remove /app/node_modules/.cache/tsconfig.tsbuildinfo

`rm /app/node_modules/.cache/tsconfig.tsbuildinfo`

This must be done inside Docker, because node_modules is in a separate volume.

## Switch backend to experiment with a script outside the webservice

To use main2.ts instead of main.ts, open docker-compose.yml and change the backend command to command: `yarn start:docker:debug:main2`.

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

Uploaded on Cloudinary
