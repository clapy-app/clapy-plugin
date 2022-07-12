import { FC, memo } from 'react';

import { _BadgeBase2 } from '../_BadgeBase2/_BadgeBase2';

interface Props {
  className?: string;
}
export const Badge2: FC<Props> = memo(function Badge2(props = {}) {
  return (
    <div>
      <_BadgeBase2 />
    </div>
  );
});
