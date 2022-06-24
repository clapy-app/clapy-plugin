import fs from 'fs';

import { wait } from '../../common/general-utils';
import { env } from '../../env-and-config/env';
import { backendDir } from '../../root';
import { User, Users } from './shared-variables';

const pipedrive = require('pipedrive');

const FgRed = '\x1b[31m';
const FgGreen = '\x1b[32m';
const analyticsDirInSrc = `${backendDir}/src/scripts/analytics`;

let jsonData: Users = require(`${analyticsDirInSrc}/user-data.json`);
let users = Object.values(jsonData);

// Pipedrive field IDs
const F = {
  numberOfCodeGenerations: '533340a077fb367358d36064454af84ff913cd57',
  numberOfDaysActive: '879996d266741c4fd3b46fcfa3edbe6f451aef1c',
  totalTimeCodeGenerationWasInterrupted: 'cdc2deb5b77df4d4ce9519520eca9a5bb94df365',
  lastTimeCodeWasGenerated: 'e63272610c7d9190d9a5c199c22b7cc91d34f7dd',
  lastTimePluginWasLunched: 'a26d0c888c9def4f09b443b4915bc8bf4a558f5b',
  generatedUrls: 'b76d108a74d97d1251bdfe7a414ed8ba37262828',
};
// Pipedrive client documentation: https://github.com/pipedrive/client-nodejs
// API reference: https://developers.pipedrive.com/docs/api/v1/Persons#searchPersons
// Tutorials and other documentation (e.g. rate limit): https://pipedrive.readme.io/docs/updating-a-person

const apiClient = pipedrive.ApiClient.instance;
let apiToken = apiClient.authentications.api_key;
apiToken.apiKey = env.pipedriveApiKey;
const personsApi = new pipedrive.PersonsApi();

const searchPerson = async (key: string) => {
  try {
    let term = key;
    let opts = {
      fields: 'custom_fields',
      exactMatch: true,
      start: 0,
      limit: 1,
    };
    const personResp = await personsApi.searchPersons(term, opts);
    const person = personResp.data.items[0]?.item;
    return person;
  } catch (e) {
    console.error(e);
  }
};
const pushCorrectData = async (person: any, user: User) => {
  try {
    const personObj = {
      [F.lastTimeCodeWasGenerated]: user.lastTimeCodeWasGenerated,
      [F.lastTimePluginWasLunched]: user.lastTimePluginWasLunched,
      [F.generatedUrls]: user.generatedUrls,
      [F.numberOfCodeGenerations]: user.numberOfCodeGenerations,
      [F.numberOfDaysActive]: user.numberOfDaysActive,
      [F.totalTimeCodeGenerationWasInterrupted]: user.totalTimeCodeGenerationWasInterrupted,
    };
    let opts = pipedrive.UpdatePerson.constructFromObject(personObj);
    const updateResp = await personsApi.updatePerson(person.id, opts);
    return updateResp;
  } catch (e) {
    console.error(e);
  }
};

export const updateANumberOfusers = async (nombreOfUsersToTest: number) => {
  let inexistantPipeDriveUsers = [];
  let usersToEdit = [];
  let counter = 0;
  const maxTestUsers = nombreOfUsersToTest;
  for (const user of users) {
    const person = await searchPerson(user.key);
    if (person && counter < maxTestUsers) {
      usersToEdit.push(person);
      await pushCorrectData(person, user);
      console.log(FgGreen, `Utilisateur modifié : ${counter + 1}/${nombreOfUsersToTest}`);
      counter++;
    } else if (!person && counter < maxTestUsers) {
      inexistantPipeDriveUsers.push(user);
      console.error(FgRed, `utilisateur raté: ${inexistantPipeDriveUsers.length}`);
    } else {
      break;
    }
    await wait(500);
  }
  console.log(inexistantPipeDriveUsers);
  const dictstring = JSON.stringify(inexistantPipeDriveUsers);
  fs.writeFile(analyticsDirInSrc + '/inexistant-PipeDriveUsers.json', dictstring, e => {
    console.log(e);
  });
};
updateANumberOfusers(users.length);
// export async function runPipedriveSample() {
//   try {
//     // const auth0Id = 'google-oauth2|111991569392093871714'; // Guilherme
//     const auth0Id = 'google-oauth2|105573232794317486965'; // Antoine gmail perso (auth0 dev)
//     // const auth0Id = 'Updated Auth0 ID';

//     ////// Auth0

//     const auth0User = await getAuth0User(auth0Id);
//     console.log(auth0User);

//     await upsertPipedrivePersonByAuth0Id(auth0User);
//   } catch (error: any) {
//     error = error?.context?.body?.error || error;
//     if (typeof error === 'string') error = new Error(error);
//     throw error;
//   }
// }
