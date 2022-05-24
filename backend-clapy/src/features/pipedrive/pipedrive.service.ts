import { User } from 'auth0';

import { env } from '../../env-and-config/env';
import { getAuth0FirstLastName, UserMetadata, UserMetaUsage } from '../user/user.service';

const pipedrive = require('pipedrive');

// Pipedrive client documentation: https://github.com/pipedrive/client-nodejs
// API reference: https://developers.pipedrive.com/docs/api/v1/Persons#searchPersons
// Tutorials and other documentation (e.g. rate limit): https://pipedrive.readme.io/docs/updating-a-person

const apiClient = pipedrive.ApiClient.instance;
let apiToken = apiClient.authentications.api_key;
apiToken.apiKey = env.pipedriveApiKey;
const personsApi = new pipedrive.PersonsApi();

// Pipedrive field IDs
const F = {
  email: 'email',
  name: 'name',
  firstName: 'first_name',
  lastName: 'last_name',
  auth0Id: '2919b1fdf1051bf7aadb26c29a063aefbea7b89d',
  auth0CreatedAt: 'f53b7669a76aacc5c3019ae73cd1f5350f50b74b',
  auth0EmailVerified: '5d3b0b6386ca3563acf3c83a28eb847f3de404b0',
  auth0LastLogin: 'd3451fd4ab053dcd7548eea7fc457fd578108fc6',
  auth0LoginsCount: '9085f36ae33fc3aa5bb9fad41aad4bc486802c7f',
  auth0UpdatedAt: 'bcb6d4f87894982ebf629d10960cf819c94380c6',
  auth0Locale: '129090bbda0cb9109ea2a7dbeca2f7666feb621c',
  auth0LocaleRaw: 'a83809015bf7dbadaec02ba10b3ff1c9ce4b3fd1',
  auth0LastIp: '314b92c61d9b95bae88f29d5af1ccae4d67b07f9',
  pluginUser: 'eb08908b9cd8d441b275a7857d480b8bb638a5ed',
  leadSource: '6eb9f9cf1c0a3dbbadca0d4dbc14fa34c522c356',
  companyName: '029b20f60ea0f85d3806f8dfb1f3a629f6cefceb',
  jobRole: '7797f1366423aba74c94649649a5b2ed439ee095',
  techTeamSize: '1604b73230d42a992c9fe951798b7953230b58cb',
  whyClapy: '591995035dd4c833f4f7ef5f589efaef20070aae',
};

export async function upsertPipedrivePersonByAuth0Id(auth0User: User) {
  const [firstName, lastName] = getAuth0FirstLastName(auth0User);
  const metadata: UserMetadata = auth0User.user_metadata || {};
  const { companyName, jobRole, techTeamSize, usage = {} } = metadata;
  const whyClapy = prepareWhyClapy(usage);

  const {
    user_id: auth0Id,
    created_at,
    email,
    email_verified,
    last_ip,
    last_login,
    logins_count,
    updated_at,
  } = auth0User;
  const locale = (auth0User as any).locale || (auth0User as any).location?.toLowerCase?.();

  const personObj = {
    [F.email]: [{ value: email }],
    [F.name]: firstName && lastName ? `${firstName} ${lastName}` : firstName || lastName || '-',
    [F.firstName]: firstName,
    [F.lastName]: lastName,
    [F.auth0Id]: auth0Id,
    [F.auth0CreatedAt]: created_at,
    [F.auth0EmailVerified]: email_verified ? 'True' : 'False',
    [F.auth0LastLogin]: last_login,
    [F.auth0LoginsCount]: logins_count,
    [F.auth0UpdatedAt]: updated_at,
    [F.auth0Locale]: locale,
    [F.auth0LocaleRaw]: locale,
    [F.auth0LastIp]: last_ip,
    [F.companyName]: companyName,
    [F.jobRole]: jobRole,
    [F.techTeamSize]: techTeamSize,
    [F.whyClapy]: whyClapy,
    [F.pluginUser]: 'True',
    [F.leadSource]: env.isDev ? 'Auth0 - dev' : 'Auth0',
  };

  let term = auth0Id;
  let opts = {
    fields: 'custom_fields',
    exactMatch: true,
    start: 0,
    limit: 1,
  };
  const personResp = await personsApi.searchPersons(term, opts);
  const person = personResp.data.items[0]?.item;

  if (person) {
    let opts = pipedrive.UpdatePerson.constructFromObject(personObj);
    const updateResp = await personsApi.updatePerson(person.id, opts);
    return updateResp;
  } else {
    let opts = pipedrive.NewPerson.constructFromObject(personObj);
    const addResp = await personsApi.addPerson(opts);
    return addResp;
  }
}

function prepareWhyClapy(usage: UserMetaUsage) {
  const whyClapy: string[] = [];
  const { other, otherDetail, ...knownUsages } = usage;
  for (const [usageName, used] of Object.entries(knownUsages)) {
    if (used) {
      whyClapy.push(usageName);
    }
  }
  if (other && otherDetail) {
    whyClapy.push(`Other - ${otherDetail}`);
  }
  return whyClapy;
}

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
