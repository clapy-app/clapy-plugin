export async function getCachedToken() {
  const [accessToken, tokenType]: [string, string] = await Promise.all([
    figma.clientStorage.getAsync('accessToken'),
    figma.clientStorage.getAsync('tokenType'),
  ]);
  return { accessToken, tokenType };
}

export async function getRefreshToken() {
  return await figma.clientStorage.getAsync('refreshToken') as string;
}

export async function setCachedToken(accessToken: string, tokenType: string, refreshToken: string) {
  await Promise.all([
    figma.clientStorage.setAsync('accessToken', accessToken),
    figma.clientStorage.setAsync('tokenType', tokenType),
    figma.clientStorage.setAsync('refreshToken', refreshToken),
  ]);
}