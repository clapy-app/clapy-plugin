import { FC, memo } from 'react';

import { useCallbackAsync2 } from '../../common/front-utils';
import { apiPost } from '../../common/http.utils';
import { fetchPlugin } from '../../common/plugin-utils';
import { Button } from '../../components/Button';

export const ExportCode: FC = memo(function ExportCode() {
  // const { figmaId } = useSelector(selectSelectionGuaranteed);
  const exportCode = useCallbackAsync2(async () => {
    const nodes = await fetchPlugin('serializeSelectedNode');
    console.log(nodes);
    const { data } = await apiPost<void>('code/export', nodes);
    console.log('res data:', data);
  }, []);
  return <Button onClick={exportCode}>Preview selection (alpha)</Button>;
});
