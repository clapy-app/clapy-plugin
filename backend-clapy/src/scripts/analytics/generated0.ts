import fs from 'fs';

import { backendDir } from '../../root';
import { Users } from './shared-variables';

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
  fs.writeFile('0codeGenerated.json', dictstring, e => {
    console.log(e);
  });
}
loop();
