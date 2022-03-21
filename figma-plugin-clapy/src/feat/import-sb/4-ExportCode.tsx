import { FC, memo, useState } from 'react';

import { useCallbackAsync2 } from '../../common/front-utils';
import { apiPost } from '../../common/http.utils';
import { fetchPlugin } from '../../common/plugin-utils';
import { CSBResponse } from '../../common/sb-serialize.model';
import { Button } from '../../components/Button';

export const ExportCode: FC = memo(function ExportCode() {
  // const { figmaId } = useSelector(selectSelectionGuaranteed);
  const [previewUrl, setPreviewUrl] = useState<string>();
  const exportCode = useCallbackAsync2(async () => {
    const nodes = await fetchPlugin('serializeSelectedNode');
    const { data } = await apiPost<CSBResponse>('code/export', nodes);
    console.log('res data:', data);
    const url = `https://${data.sandbox_id}.csb.app/`;
    window.open(url, '_blank', 'noopener');
    setPreviewUrl(url);
  }, []);
  return (
    <>
      <Button onClick={exportCode}>Preview selection (alpha)</Button>
      {!!previewUrl && (
        <a href={previewUrl} target='_blank' rel='noreferrer'>
          Open preview
        </a>
      )}
    </>
  );
});
