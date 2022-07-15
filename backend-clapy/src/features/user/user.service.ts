import { UnauthorizedException } from '@nestjs/common';
import type { User } from 'auth0';
import { ManagementClient } from 'auth0';

import { env } from '../../env-and-config/env.js';

const { auth0Domain, auth0BackendClientId, auth0BackendClientSecret } = env;

var auth0Management = new ManagementClient({
  domain: auth0Domain,
  clientId: auth0BackendClientId,
  clientSecret: auth0BackendClientSecret,
  scope: 'read:users update:users',
});

export async function getAuth0User(userId: string | undefined) {
  if (!userId) throw new UnauthorizedException();
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

export interface UserMetadata {
  firstName?: string;
  lastName?: string;
  companyName?: string;
  jobRole?: string;
  techTeamSize?: string;
  email?: string;
  picture?: string;
  usage?: UserMetaUsage;
  licenceStartDate?: number;
  licenceExpirationDate?: number;
}

export interface UserMetaUsage {
  components?: boolean;
  designSystem?: boolean;
  landingPages?: boolean;
  other?: boolean;
  otherDetail?: string;
}

/**
 * @example
 * ```typescript
 * const [firstName, lastName] = getFirstLastName(user);
 * ```
 */
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
  { firstName, lastName, companyName, jobRole, techTeamSize } = {} as UserMetadata,
) {
  return !firstName || !lastName || !companyName || !jobRole || !techTeamSize;
}

// Ensure this method is synced with the plugin equivalent: figma-plugin-clapy/src/pages/user/user-service.ts
export function hasMissingMetaUsage(userMetaUsage: UserMetaUsage | undefined) {
  const { components, designSystem, landingPages, other, otherDetail } = userMetaUsage || {};
  return !components && !designSystem && !landingPages && !(other && otherDetail);
}
