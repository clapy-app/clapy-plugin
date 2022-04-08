import { FC, memo, useState } from 'react';
import { useSelector } from 'react-redux';

import { ExportImageMap } from '../../common/app-models';
import { useCallbackAsync2 } from '../../common/front-utils';
import { apiPost } from '../../common/http.utils';
import { fetchPlugin } from '../../common/plugin-utils';
import { CSBResponse } from '../../common/sb-serialize.model';
import { Button } from '../../components/Button';
import { env } from '../../environment/env';
import classes from '../1-import-sb/1-ImportSb.module.scss';
import { selectIsAlphaDTCUser } from '../auth/auth-slice';

export const ExportCode: FC = memo(function ExportCode() {
  const isAlphaDTCUser = useSelector(selectIsAlphaDTCUser);
  if (!isAlphaDTCUser) return null;

  return <ExportCodeInner />;
});

// Flag for development only. Will be ignored in production.
const enableCodeSandbox = false;

const ExportCodeInner: FC = memo(function ExportCodeInner() {
  // const { figmaId } = useSelector(selectSelectionGuaranteed);
  const [previewUrl, setPreviewUrl] = useState<string>();
  const [error, setError] = useState<any>();
  const exportCode = useCallbackAsync2(async () => {
    try {
      setError(undefined);
      setPreviewUrl('loading');

      // Extract the Figma configuration
      const [parent, root, imagesFigmaIds] = await fetchPlugin('serializeSelectedNode');
      const images: ExportImageMap = {};
      const nodes = { parent, root, images };

      // Upload assets to a CDN before generating the code
      for (const [imageFigmaId, imageFigmaUrl] of Object.entries(imagesFigmaIds)) {
        // If required, I can upload to CDN here. Figma can provide the image hash and the URL.
        // const assetUrl = await uploadAsset(fileAsUint8ArrayRaw);
        images[imageFigmaId] = imageFigmaUrl;
      }

      // TODO gestion de l'unicité : utiliser le hash de l'image comme ID unique
      // TODO improvements for images
      // Small UI update: 2 steps loading (show a loader?)
      // Check if the hash is already in database. If yes, reuse the URL.
      // If not, upload to CDN and save the hash + URL in database.
      // When a node has an image, apply relevant formattings using the info from the node.
      // Include the image in the generated project using codesandbox binary feature and point to it in the HTML

      if (!env.isDev || enableCodeSandbox) {
        const { data } = await apiPost<CSBResponse>('code/export', nodes);
        if (data) {
          const url = `https://${data.sandbox_id}.csb.app/`;
          console.log('sandbox:', url);
          // window.open(url, '_blank', 'noopener');
          setPreviewUrl(url);
          return;
        }
      } else {
        console.log(JSON.stringify(nodes));
      }

      setPreviewUrl(undefined);
    } catch (error: any) {
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

      {!!error && <ErrorComp error={error} />}
    </>
  );
});

interface ErrorCompProps {
  error: any;
}

const ErrorComp: FC<ErrorCompProps> = memo(function ErrorComp({ error }) {
  if (!error) return null;
  const errorStr = JSON.stringify(error);
  if (error === 'Interrupted') {
    return (
      <div>
        <em>{errorStr}</em>
      </div>
    );
  }
  // Mail link generated with https://mailtolink.me/
  const emailLink = `mailto:support@clapy.co?subject=Reporting%20an%20error%20I%20faced%20using%20Clapy&body=Hi%20Clapy%20team%2C%0D%0A%0D%0AI%20faced%20the%20following%20error%20while%20using%20the%20Clapy.%0D%0A%0D%0AHere%20are%20the%20steps%20to%20reproduce%3A%0D%0A%0D%0A-%20XXX%0D%0A-%20XXX%0D%0A%0D%0AThe%20error%3A%0D%0A%0D%0A${encodeURIComponent(
    errorStr,
  )}`;
  return (
    <div className={classes.errorWrapper}>
      <p>
        Oops, something went wrong! Please contact us.{' '}
        <a href={emailLink} target='_blank' rel='noopener noreferrer'>
          Here is an email prefilled with the error message below
        </a>
        .
      </p>
      <p className={classes.errorWrapper2}>
        <em>{/* error.message || */ errorStr}</em>
      </p>
      <hr />
    </div>
  );
});
