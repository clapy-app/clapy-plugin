import { env } from '../../environment/env';

const cloudName = 'clapy';
const resourceType = 'auto';

export const cloudinaryUploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`;

export async function uploadAsset(fileAsUint8ArrayRaw: number[]) {
  const fileUint = Uint8Array.from(fileAsUint8ArrayRaw);
  const blob = new Blob([fileUint]);
  const formData = new FormData();
  formData.append('file', blob);
  formData.append('upload_preset', env.isDev ? 'code-export-dev' : 'code-export');
  return (await (await fetch(cloudinaryUploadUrl, { method: 'POST', body: formData })).json()).secure_url;
}
