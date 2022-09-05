import { UnauthorizedException } from '@nestjs/common';
import { ManagementClient } from 'auth0';
import axios from 'axios';
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

// You must first validate the account user IDs (primary and secondary), e.g. by extracting them from validated JWTs.
export async function linkUsers(
  primaryAccountUserId: string,
  secondaryAccountUserId: string,
  secondaryAccountProvider: string,
) {
  const url = `https://${auth0Domain}/api/v2/users/${primaryAccountUserId}/identities`;
  return (
    await axios.post(
      url,
      {
        provider: secondaryAccountProvider,
        user_id: secondaryAccountUserId,
      },
      {
        headers: {
          Authorization: `Bearer ${await auth0Management.getAccessToken()}`,
        },
      },
    )
  ).data;
}
