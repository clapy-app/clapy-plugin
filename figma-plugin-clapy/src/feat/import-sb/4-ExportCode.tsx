import { FC, memo, useState } from 'react';

import { useCallbackAsync2 } from '../../common/front-utils';
import { apiPost } from '../../common/http.utils';
import { fetchPlugin } from '../../common/plugin-utils';
import { CSBResponse } from '../../common/sb-serialize.model';
import { Button } from '../../components/Button';
import classes from './1-ImportSb.module.scss';

export const ExportCode: FC = memo(function ExportCode() {
  // const { figmaId } = useSelector(selectSelectionGuaranteed);
  const [previewUrl, setPreviewUrl] = useState<string>();
  const exportCode = useCallbackAsync2(async () => {
    const nodes = await fetchPlugin('serializeSelectedNode');
    const { data } = await apiPost<CSBResponse>('code/export', nodes);
    if (data) {
      const url = `https://${data.sandbox_id}.csb.app/`;
      console.log('sandbox:', url);
      // window.open(url, '_blank', 'noopener');
      setPreviewUrl(url);
    }
  }, []);
  return (
    <div className={classes.codeExportRow}>
      <Button onClick={exportCode}>Generate selection preview (alpha)</Button>
      {previewUrl && (
        <a target={'_blank'} href={previewUrl} rel='noreferrer'>
          Open
        </a>
      )}
    </div>
  );
});
