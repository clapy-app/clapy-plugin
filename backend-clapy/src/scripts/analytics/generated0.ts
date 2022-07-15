import { writeFile } from 'fs/promises';

import { backendDir } from '../../root.js';
import type { Users } from './shared-variables';

const analyticsDirInSrc = `${backendDir}/src/scripts/analytics`;
let jsonData: Users = require(`${analyticsDirInSrc}/user-data.json`);
let users = Object.values(jsonData);

async function loop() {
  let result = [];
  for (const user of users) {
    if (user.numberOfCodeGenerations === 0) {
      result.push(user);
    }
  }
  const dictstring = JSON.stringify(result);
  await writeFile('0codeGenerated.json', dictstring);
}
loop();
