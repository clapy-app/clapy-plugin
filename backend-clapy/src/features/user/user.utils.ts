import { UnauthorizedException } from '@nestjs/common';
import type { User } from 'auth0';
import { ManagementClient } from 'auth0';

import type { Nil } from '../../common/general-utils.js';
import { env } from '../../env-and-config/env.js';

const { auth0Domain, auth0BackendClientId, auth0BackendClientSecret } = env;

var auth0Management = new ManagementClient({
  domain: auth0Domain,
  clientId: auth0BackendClientId,
  clientSecret: auth0BackendClientSecret,
  scope: 'read:users update:users read:user_idp_tokens',
});

export interface UserMetadata {
  firstName?: string;
  lastName?: string;
  companyName?: string;
  phone?: string;
  jobRole?: string;
  techTeamSize?: string;
  email?: string;
  picture?: string;
  usage?: UserMetaUsage;
  licenceStartDate?: number | null;
  licenceExpirationDate?: number | null;
  quotas?: number;
  quotasMax?: number;
  isLicenseExpired?: boolean;
  limitedUser?: boolean;
}

export interface UserMetaUsage {
  components?: boolean;
  designSystem?: boolean;
  landingPages?: boolean;
  other?: boolean;
  otherDetail?: string;
}

export async function getAuth0User(userId: string | undefined) {
  const message = 'The Auth0 user ID is missing in the request.';
  if (!userId) throw new UnauthorizedException({ message }, message);
  return await auth0Management.getUser({ id: userId });
}

export async function updateAuth0UserMetadata(userId: string | undefined, userMetadata: UserMetadata) {
  if (!userId) throw new UnauthorizedException();
  return auth0Management.updateUserMetadata({ id: userId }, userMetadata);
}

export async function updateAuth0UserRoles(userId: string | undefined, roles: string[]) {
  if (!userId) throw new UnauthorizedException();
  return auth0Management.assignRolestoUser({ id: userId }, { roles });
}

export async function removeAuth0UserRoles(userId: string | undefined, roles: string[]) {
  if (!userId) throw new UnauthorizedException();
  return auth0Management.removeRolesFromUser({ id: userId }, { roles });
}

/**
 * @example
 * ```typescript
 * const [firstName, lastName] = getFirstLastName(user);
 * ```
 */
export interface AccessTokenDecoded {
  // Audience - if array, second member could be "https://clapy.eu.auth0.com/userinfo"
  aud: 'clapy' | ['clapy', ...string[]];
  azp: string; // "6erPCh883JBV4COxwAHLbhbgNgarqaq5" - Client ID of the app to which the token was delivered
  exp: number; // 1647606409 - Expiration time
  'https://hasura.io/jwt/claims': {
    'x-hasura-allowed-roles': string[]; // ['team@earlymetrics.com', 'all@foo.com']
    'x-hasura-default-role': string; //"team@earlymetrics.com"
    'x-hasura-user-id': string; // "auth0|622f597dc4b56e0071615ebe"} - auth0 user ID repeated for Hasura
  };
  'https://clapy.co/roles'?: string[];
  'https://clapy.co/licence-expiration-date'?: number;
  'https://clapy.co/limited-user'?: boolean;
  iat: number; // 1647520009 - Issued at
  iss: string; // "https://clapy.eu.auth0.com/" - Issuer
  scope: string; // "offline_access"
  sub: string; // "auth0|622f597dc4b56e0071615ebe" - auth0 user ID
}

export function getAuth0FirstLastName(user: User) {
  try {
    let firstName: string | undefined;
    let lastName: string | undefined;
    const metadata: UserMetadata | undefined = user.user_metadata;
    ({ firstName, lastName } = metadata || {});
    if (!firstName && !lastName) {
      [firstName, lastName] = [user.given_name, user.family_name];
    }
    if (!firstName && !lastName) {
      [firstName, lastName] = splitName(removeSuffix(user.name));
    }
    if (!firstName && !lastName) {
      [firstName, lastName] = [user.nickname || removeSuffix(user.email) || '', ''];
    }
    if (firstName == null) firstName = '';
    if (lastName == null) lastName = '';
    return [firstName, lastName] as const;
  } catch (err) {
    return ['', ''] as const;
  }
}

function splitName(name: string | undefined) {
  if (!name) return [name, ''];
  const i = name.indexOf(' ');
  if (i === -1) return [name, ''];
  return [name.substring(0, i), name.substring(i + 1)];
}

function removeSuffix(name: string | undefined) {
  if (!name) return name;
  for (const separator of ['@']) {
    const i = name.indexOf(separator);
    if (i !== -1) {
      name = name.substring(0, i);
    }
  }
  return name;
}

// Ensure this method is synced with the plugin equivalent: figma-plugin-clapy/src/pages/user/user-service.ts
export function hasMissingMetaProfile(
  { firstName, lastName, companyName, jobRole, techTeamSize, phone } = {} as UserMetadata,
) {
  return (!companyName && !phone) || !firstName || !lastName || !jobRole || !techTeamSize;
}

// Ensure this method is synced with the plugin equivalent: figma-plugin-clapy/src/pages/user/user-service.ts
export function hasMissingMetaUsage(userMetaUsage: UserMetaUsage | undefined) {
  const { components, designSystem, landingPages, other, otherDetail } = userMetaUsage || {};
  return !components && !designSystem && !landingPages && !(other && otherDetail);
}

export const hasRoleNoCodeSandbox = (user: AccessTokenDecoded) =>
  user?.['https://clapy.co/roles']?.includes('noCodesandbox');
export const hasRoleIncreasedQuota = (user: AccessTokenDecoded) =>
  user?.['https://clapy.co/roles']?.includes('increasedQuota');

// TODO edit here and in src/core/auth/auth-slice.ts
export const hasRoleFreeStripeAccess = (user: AccessTokenDecoded | Nil) =>
  user?.['https://clapy.co/roles']?.includes('FreeStripeAccess');

export function hasRoleDevTools(user: AccessTokenDecoded | Nil) {
  return !!user?.['https://clapy.co/roles']?.includes('dev_tools');
}
