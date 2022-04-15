import { FC, memo, useState } from 'react';
import { useSelector } from 'react-redux';

import classes from '../1-import-sb/1-ImportSb.module.scss';
import { ErrorComp } from '../1-import-sb/detail/ErrorComp';
import { handleError } from '../../common/error-utils';
import { useCallbackAsync2 } from '../../common/front-utils';
import { apiPost } from '../../common/http.utils';
import { fetchPlugin } from '../../common/plugin-utils';
import { CSBResponse, ExportImageMap2 } from '../../common/sb-serialize.model';
import { Button } from '../../components-old/Button';
import { env } from '../../environment/env';
import { selectIsAlphaDTCUser } from '../auth/auth-slice';
import { uploadAssetFromUintArrayRaw } from './cloudinary';

export const ExportCode: FC = memo(function ExportCode() {
  const isAlphaDTCUser = useSelector(selectIsAlphaDTCUser);
  if (!isAlphaDTCUser) return null;

  return <ExportCodeInner />;
});

// Flag for development only. Will be ignored in production.
// To disable sending to codesandbox, open the API controller and change the default of uploadToCsb
// backend-clapy/src/features/export-code/1-code-controller.ts
const sendToApi = true;

const ExportCodeInner: FC = memo(function ExportCodeInner() {
  // const { figmaId } = useSelector(selectSelectionGuaranteed);
  const [previewUrl, setPreviewUrl] = useState<string>();
  const [error, setError] = useState<any>();
  const exportCode = useCallbackAsync2(async () => {
    try {
      setError(undefined);
      setPreviewUrl('loading');

      // Extract the Figma configuration
      const [parent, root, imagesExtracted, extraConfig] = await fetchPlugin('serializeSelectedNode');
      const images: ExportImageMap2 = {};
      const nodes = { parent, root, images, extraConfig };

      // Upload assets to a CDN before generating the code
      for (const [imageHash, imageFigmaEntry] of Object.entries(imagesExtracted)) {
        const { bytes, ...imageEntryRest } = imageFigmaEntry;
        // If required, I can upload to CDN here. Figma can provide the image hash and the URL.
        // const assetUrl = await uploadAsset(fileAsUint8ArrayRaw);

        // Replace Figma asset URL with our own CDN. Benefits:
        // - Avoid CORS issue in codesandbox when exporting the project as zip
        // - Allows image compression if useful later, instead of keeping the original HD image.
        let url = await uploadAssetFromUintArrayRaw(Uint8Array.from(bytes), imageHash);
        if (!url) {
          handleError(`BUG Failed to upload the image with hash ${imageHash} on the CDN.`);
        } else {
          images[imageHash] = { ...imageEntryRest, url };
        }
      }

      // TODO gestion de l'unicité : utiliser le hash de l'image comme ID unique
      // TODO improvements for images
      // Small UI update: 2 steps loading (show a loader?)
      // Check if the hash is already in database. If yes, reuse the URL.
      // If not, upload to CDN and save the hash + URL in database.
      // When a node has an image, apply relevant formattings using the info from the node.
      // Include the image in the generated project using codesandbox binary feature and point to it in the HTML

      if (env.isDev) {
        console.log(JSON.stringify(nodes));
      }
      if (!env.isDev || sendToApi) {
        const { data } = await apiPost<CSBResponse>('code/export', nodes);
        if (data) {
          const url = `https://${data.sandbox_id}.csb.app/`;
          console.log('sandbox:', url);
          // window.open(url, '_blank', 'noopener');
          setPreviewUrl(url);
          return;
        }
      }

      setPreviewUrl(undefined);
    } catch (error: any) {
      handleError(error);
      if (error?.message === 'NODE_NOT_VISIBLE') {
        error = `Node ${error.nodeName} is not visible, you must select a visible node to export as code.`;
      }
      setError(error);
      setPreviewUrl(undefined);
      throw error;
    }
  }, []);
  return (
    <>
      <div className={classes.codeExportRow}>
        <Button onClick={exportCode}>Generate selection preview (alpha)</Button>
        {!error && (
          <>
            {previewUrl === 'loading' && 'loading...'}
            {previewUrl && previewUrl !== 'loading' && (
              <a target={'_blank'} href={previewUrl} rel='noreferrer'>
                Open
              </a>
            )}
          </>
        )}
      </div>

      <ErrorComp error={error} />
    </>
  );
});

export interface ErrorCompProps {
  error: any;
}
