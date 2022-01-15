export async function getCachedToken() {
  const token: string = await figma.clientStorage.getAsync('my-token');
  console.log('token:', token);
  return token;
}

export async function setCachedToken(token: string) {
  await figma.clientStorage.setAsync('my-token', token);
}