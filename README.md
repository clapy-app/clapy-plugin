## Usage

- `yarn install:all` to install dependencies in root and subprojects
- To develop:
  - In VS Code, use "Start Debugging" command (Ctrl+F11 with my keyboard shortcuts) to start everything (docker, plugin...) + start the debugger (based on the launch config).
  - Alternatively, you can build everything (but skip the debugger) by running the default build task, "Run Build Task" command (Ctrl+Shift+B on my side) (based on the tasks config).
  - Alternatively, `yarn dev` to start everything through command-line.

## Troubleshooting

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

## Notes for later

codesandbox uses parcel to bundle in the browser.
https://astexplorer.net/ to list AST tools
https://ts-ast-viewer.com/ for typescript AST playground

## CSS AST tools

https://github.com/csstree/csstree  20M downloads, 1.4k likes -- good, targetting my use case
https://github.com/postcss/postcss  66M downlaods, 26k likes -- has a parser, but too general purpose, probably too big and harder to use.
https://github.com/reworkcss/css  12M downloads, 1.4k likes -- seems to focus on read, not write

downloads are weekly figures on npmjs.com.

Inspiration to convert figma config to CSS: https://github.com/figma-plugin-helper-functions/figma-plugin-helpers/blob/master/src/helpers/getCSSStyles.ts
