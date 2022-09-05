import type { GithubCredentials } from '../../../common/app-models.js';

// Important: on logout, all tokens are cleared here. Update it when more user data are stored.
export async function clearCachedTokens() {
  await Promise.all([
    figma.clientStorage.deleteAsync('accessToken'),
    figma.clientStorage.deleteAsync('tokenType'),
    figma.clientStorage.deleteAsync('refreshToken'),
    figma.clientStorage.deleteAsync('githubCachedCredentials'),
    figma.clientStorage.deleteAsync('githubSettings'),
  ]);
}

// todo: A modifier dans une semaine retirer hasClosedUpdateToast.
export async function getCachedToken() {
  const [accessToken, tokenType]: [string | null, string | null] = await Promise.all([
    figma.clientStorage.getAsync('accessToken'),
    figma.clientStorage.getAsync('tokenType'),
  ]);
  return { accessToken, tokenType };
}

export async function getRefreshToken() {
  return (await figma.clientStorage.getAsync('refreshToken')) as string | null;
}

export async function setCachedToken(accessToken: string, tokenType: string, refreshToken: string) {
  await Promise.all([
    figma.clientStorage.setAsync('accessToken', accessToken),
    figma.clientStorage.setAsync('tokenType', tokenType),
    figma.clientStorage.setAsync('refreshToken', refreshToken),
  ]);
}

export async function getCachedIsFirstLogin() {
  return (await figma.clientStorage.getAsync('isFirstLogin')) as boolean | undefined;
}
export async function setCachedIsFirstLogin() {
  await figma.clientStorage.setAsync('isFirstLogin', true);
}

export async function getGithubCachedCredentials() {
  return figma.clientStorage.getAsync('githubCachedCredentials') as Promise<GithubCredentials | undefined>;
}

export async function setGithubCachedCredentials(githubCachedCredentials: GithubCredentials | undefined) {
  if (!githubCachedCredentials) {
    await figma.clientStorage.deleteAsync('githubCachedCredentials');
  } else {
    await figma.clientStorage.setAsync('githubCachedCredentials', githubCachedCredentials);
  }
}
