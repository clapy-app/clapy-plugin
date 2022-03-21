## Usage

- `yarn install:all` to install dependencies in root and subprojects
- To develop:
  - In VS Code, use "Start Debugging" command (Ctrl+F11 with my keyboard shortcuts) to start everything (docker, plugin...) + start the debugger (based on the launch config).
  - Alternatively, you can build everything (but skip the debugger) by running the default build task, "Run Build Task" command (Ctrl+Shift+B on my side) (based on the tasks config).
  - Alternatively, `yarn dev` to start everything through command-line.

## Yarn auto-completion

Suggested package: https://github.com/dsifford/yarn-completion
Alternative: https://github.com/mklabs/yarn-completions
Discussion: https://github.com/yarnpkg/yarn/issues/609

## Notes for later

codesandbox uses parcel to bundle in the browser.
