export async function getCachedToken() {
  const token = await figma.clientStorage.getAsync('my-token');
  console.log('token:', token);
  return token;
}