// import axios from 'axios';
//
// import { env } from '../../env-and-config/env.js';
//
// var options = {
//   method: 'POST',
//   url: `https://${env.auth0Domain}/oauth/token`,
//   headers: { 'content-type': 'application/x-www-form-urlencoded' },
//   data: new URLSearchParams({
//     grant_type: 'client_credentials',
//     client_id: env.auth0BackendClientId,
//     client_secret: env.auth0BackendClientSecret,
//     audience: `https://${env.auth0Domain}/api/v2/`,
//   }),
// };
//
// export async function printToken() {
//   try {
//     const response = await axios.request(options);
//     console.log(response.data);
//   } catch (error) {
//     console.error(error);
//   }
// }
import { getAuth0User } from '../user/user.utils.js';

export async function getGithubAccessToken(authUserId: string) {
  const auth0User = await getAuth0User(authUserId);
  return auth0User.identities?.find(idp => idp.provider === 'github')?.access_token;
}
