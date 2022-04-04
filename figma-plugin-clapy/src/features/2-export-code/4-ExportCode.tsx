import { FC, memo, useState } from 'react';
import { useSelector } from 'react-redux';

import { useCallbackAsync2 } from '../../common/front-utils';
import { fetchPlugin } from '../../common/plugin-utils';
import { Button } from '../../components/Button';
import classes from '../1-import-sb/1-ImportSb.module.scss';
import { selectIsAlphaDTCUser } from '../auth/auth-slice';

export const ExportCode: FC = memo(function ExportCode() {
  const isAlphaDTCUser = useSelector(selectIsAlphaDTCUser);
  if (!isAlphaDTCUser) return null;

  return <ExportCodeInner />;
});

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

      console.log(JSON.stringify(nodes));

      // const { data } = await apiPost<CSBResponse>('code/export', nodes);
      // if (data) {
      //   const url = `https://${data.sandbox_id}.csb.app/`;
      //   console.log('sandbox:', url);
      //   // window.open(url, '_blank', 'noopener');
      //   setPreviewUrl(url);
      //   return;
      // }

      setPreviewUrl(undefined);
    } catch (error) {
      setError(error);
      setPreviewUrl(undefined);
      throw error;
    }
  }, []);
  return (
    <div className={classes.codeExportRow}>
      <Button onClick={exportCode}>Generate selection preview (alpha)</Button>
      {error ? (
        <>Error! {error.message}</>
      ) : (
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
  );
});
