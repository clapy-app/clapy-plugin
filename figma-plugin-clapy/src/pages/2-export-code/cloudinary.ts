import { env } from '../../environment/env';

const cloudName = 'clapy';
const resourceType = 'auto';

export const cloudinaryUploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`;

export async function uploadAssetFromUintArrayRaw(fileUint: Uint8Array, imageHash: string) {
  const blob = new Blob([fileUint]);
  return uploadAsset(blob, imageHash);
}

export async function uploadAssetFromUrl(url: string, imageHash: string) {
  return uploadAsset(url, imageHash);
}

async function uploadAsset(file: Blob | string, imageHash: string) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', env.isDev ? 'code-export-dev' : 'code-export');
  formData.append('public_id', imageHash);
  const resp = await (await fetch(cloudinaryUploadUrl, { method: 'POST', body: formData })).json();
  const { secure_url } = resp;
  if (!secure_url) {
    throw new Error(`BUG Missing cloudinary response URL. Response: ${JSON.stringify(resp)}`);
  }
  return secure_url as string;
}
