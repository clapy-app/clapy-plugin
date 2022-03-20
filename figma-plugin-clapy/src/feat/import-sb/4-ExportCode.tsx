import { FC, memo } from 'react';

import { useCallbackAsync2 } from '../../common/general-utils';
import { fetchPlugin } from '../../common/plugin-utils';
import { Button } from '../../components/Button';

export const ExportCode: FC = memo(function ExportCode() {
  // const { figmaId } = useSelector(selectSelectionGuaranteed);
  const exportCode = useCallbackAsync2(async () => {
    const nodes = await fetchPlugin('serializeNode');
  }, []);
  return <Button onClick={exportCode}>Export code</Button>;
});
