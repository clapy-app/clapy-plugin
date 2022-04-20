import { FC, memo, useCallback, useState } from 'react';
import { toast } from 'react-toastify';

import { handleError } from '../../common/error-utils';
import { useCallbackAsync2 } from '../../common/front-utils';
import { apiPost } from '../../common/http.utils';
import { fetchPlugin } from '../../common/plugin-utils';
import { CSBResponse, ExportImageMap2 } from '../../common/sb-serialize.model';
import { env } from '../../environment/env';
import { uploadAssetFromUintArrayRaw } from '../../features/2-export-code/cloudinary';
import { ErrorAlert2, ErrorAlertButtons } from '../ErrorAlert/ErrorAlert';
import { BackToCodeGen } from './BackToCodeGen/BackToCodeGen';
import { Button } from './Button/Button';
import { EditCodeButton } from './EditCodeButton/EditCodeButton';
import classes from './FigmaToCodeHome.module.css';
import { LivePreviewButton } from './LivePreviewButton/LivePreviewButton';
import { SelectionPreview } from './SelectionPreview/SelectionPreview';

// Flag for development only. Will be ignored in production.
// To disable sending to codesandbox, open the API controller and change the default of uploadToCsb
// backend-clapy/src/features/export-code/1-code-controller.ts
const sendToApi = true;

export type MyStates = 'loading' | 'noselection' | 'selectionko' | 'selection' | 'generated';

interface Props {
  selectionPreview: string | false | undefined;
}

export const FigmaToCodeHome: FC<Props> = memo(function FigmaToCodeHome(props) {
  const { selectionPreview } = props;
  const [sandboxId, setSandboxId] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const state: MyStates = isLoading
    ? 'loading'
    : sandboxId
    ? 'generated'
    : selectionPreview
    ? 'selection'
    : selectionPreview === false
    ? 'selectionko'
    : 'noselection';

  const generateCode = useCallbackAsync2(async () => {
    try {
      setIsLoading(true);
      setSandboxId('loading');

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
          if (env.isDev) {
            console.log('sandbox preview:', `https://${data.sandbox_id}.csb.app/`);
          }
          // window.open(url, '_blank', 'noopener');
          setSandboxId(data.sandbox_id);
          return;
        }
      }

      setSandboxId(undefined);
    } catch (error: any) {
      handleError(error);
      if (error?.message === 'NODE_NOT_VISIBLE') {
        error = `Node ${error.nodeName} is not visible, you must select a visible node to export as code.`;
      }
      toastError(error);
      setSandboxId(undefined);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const backToSelection = useCallback(() => {
    setSandboxId(undefined);
  }, []);

  return (
    <>
      <div className={classes.previewTitle}>
        {state === 'noselection' && (
          <>
            Choose the element <br />
            you need to code
          </>
        )}
        {(state === 'selection' || state === 'selectionko') && <>Ready to code</>}
        {isLoading && <>Your code is loading...</>}
        {state === 'generated' && <>And... it’s done!</>}
      </div>
      <SelectionPreview state={state} selectionPreview={selectionPreview} />
      {state !== 'generated' && (
        <Button onClick={generateCode} disabled={state === 'loading' || state === 'noselection'} loading={isLoading}>
          &lt; Generate code &gt;
        </Button>
      )}
      {state === 'generated' && (
        <>
          <div className={classes.openResult}>
            <LivePreviewButton url={`https://${sandboxId}.csb.app/`} />
            <EditCodeButton url={`https://codesandbox.io/s/${sandboxId}`} />
          </div>
          <BackToCodeGen onClick={backToSelection} />
        </>
      )}
    </>
  );
});

function toastError(error: any) {
  // Last unused piece from ErrorComp:
  // if (!error) return null;
  // if (error === 'Interrupted') {
  //   return (
  //     <div>
  //       <em>{error}</em>
  //     </div>
  //   );
  // }

  let errorStr = error ? error?.stack || JSON.stringify(error, Object.getOwnPropertyNames(error)) : 'Unknown error';
  if (error?.nodeName) {
    errorStr = `${error.nodeName}\n${errorStr}`;
  }
  // Mail link generated with https://mailtolink.me/
  const emailLink = `mailto:support@clapy.co?subject=Reporting%20an%20error%20I%20faced%20using%20Clapy&body=Hi%20Clapy%20team%2C%0D%0A%0D%0AI%20faced%20the%20following%20error%20while%20using%20the%20Clapy.%0D%0A%0D%0AHere%20are%20the%20steps%20to%20reproduce%3A%0D%0A%0D%0A-%20XXX%0D%0A-%20XXX%0D%0A%0D%0AThe%20error%3A%0D%0A%0D%0A${encodeURIComponent(
    errorStr,
  )}`;
  const errorMsgDisplayed = `Error: ${error?.message || errorStr}`;
  toast(<ErrorAlert2>{errorMsgDisplayed}</ErrorAlert2>, {
    closeButton: ({ closeToast }) => <ErrorAlertButtons closeToast={closeToast} emailLink={emailLink} />,
  });
}
