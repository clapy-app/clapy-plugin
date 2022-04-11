import { env } from '../../environment/env';

const cloudName = 'clapy';
const resourceType = 'auto';

export const cloudinaryUploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`;

export async function uploadAssetFromUintArrayRaw(fileAsUint8ArrayRaw: number[], imageHash: string) {
  const fileUint = Uint8Array.from(fileAsUint8ArrayRaw);
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
  return (await (await fetch(cloudinaryUploadUrl, { method: 'POST', body: formData })).json()).secure_url as string;
}
