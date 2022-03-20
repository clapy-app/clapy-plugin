import { FC, memo } from 'react';

import { useCallbackAsync2 } from '../../common/front-utils';
import { fetchPlugin } from '../../common/plugin-utils';
import { Button } from '../../components/Button';

export const ExportCode: FC = memo(function ExportCode() {
  // const { figmaId } = useSelector(selectSelectionGuaranteed);
  const exportCode = useCallbackAsync2(async () => {
    const nodes = await fetchPlugin('serializeSelectedNode');
    console.log(nodes);
    // TODO Send to the API here
  }, []);
  return <Button onClick={exportCode}>Export code</Button>;
});
