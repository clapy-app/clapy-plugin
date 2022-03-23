import { FC, memo } from 'react';

import { useCallbackAsync2 } from '../../common/front-utils';
import { apiPost } from '../../common/http.utils';
import { fetchPlugin } from '../../common/plugin-utils';
import { CSBResponse } from '../../common/sb-serialize.model';
import { Button } from '../../components/Button';

export const ExportCode: FC = memo(function ExportCode() {
  // const { figmaId } = useSelector(selectSelectionGuaranteed);
  const exportCode = useCallbackAsync2(async () => {
    const nodes = await fetchPlugin('serializeSelectedNode');
    const { data } = await apiPost<CSBResponse>('code/export', nodes);
    if (data) {
      const url = `https://${data.sandbox_id}.csb.app/`;
      console.log('sandbox:', url);
      window.open(url, '_blank', 'noopener');
    }
  }, []);
  return (
    <>
      <Button onClick={exportCode}>Preview selection (alpha)</Button>
    </>
  );
});
