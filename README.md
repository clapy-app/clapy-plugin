## Usage

- `yarn install:all` to install dependencies in root and subprojects
- To develop:
  - Build and watch everything: in VS Code: "Run Build Task" command (Ctrl+Shift+B with my keyboard shortcuts) to run the default build task and build everything (1)
  - "Start Debugging" command (F11 with my keyboard shortcuts) to start the debugger for the webservice
- Alternatively, to develop on the webservice only:
  - `yarn up` through command-line to start all docker containers
  - "Start Debugging" command (F11 with my keyboard shortcuts) to start the debugger for the webservice

(1) Alternative: `yarn dev` through command-line to start everything

Note: for now, `Hasura console` task is excluded from the default build because it's rarely useful in current developments. To start it, run this task or `yarn console` in the terminal. If you often need it, feel free to uncomment it in the default build task (.vscode/tasks.json, first task).

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

## Notes for later

- codesandbox uses parcel to bundle in the browser.
- AST tools:
    https://ts-ast-viewer.com/ for typescript AST playground
    https://astexplorer.net/ to list AST tools and play, e.g. CSS AST
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

https://github.com/csstree/csstree  20M downloads, 1.4k likes -- good, targetting my use case
https://github.com/postcss/postcss  66M downlaods, 26k likes -- has a parser, but too general purpose, probably too big and harder to use.
https://github.com/reworkcss/css  12M downloads, 1.4k likes -- seems to focus on read, not write

downloads are weekly figures on npmjs.com.

Inspiration to convert figma config to CSS: https://github.com/figma-plugin-helper-functions/figma-plugin-helpers/blob/master/src/helpers/getCSSStyles.ts

## CDN for assets

Uploaded on Cloudinary - Antoine OL account - https://cloudinary.com/console/c-4ef63b1d9baacdff4573fef39c2ef0/media_library/folders/home
