import { FC, memo, useState } from 'react';
import { useSelector } from 'react-redux';

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
      const [parent, root] = await fetchPlugin('serializeSelectedNode');
      const nodes = { parent, root };

      // TODO test an image upload
      // Add a dict of images I fill while going through the tree. Store node ID (& other useful info?)
      // Get back to client. The client requests the back for each image, get the binary or whatever is applicable.
      // Small UI update: 2 steps loading (show a loader?)
      // The client uploads the image to cloudinary using their SDK
      // Ensure we save the image hash.
      // Save the hash + URL in database. If an image hash is found in DB, reuse the link instead of reuploading.
      // Add the URLs in the top-level image dict. Send everything to the webservice.
      // THe back adds the dict to the project context.
      // When a node has an image, get the URL from the dict, the formatting info from the node and generate the code.
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
    } catch (error) {
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
