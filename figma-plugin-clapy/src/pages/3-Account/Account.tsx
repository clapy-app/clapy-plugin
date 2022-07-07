import type { FC } from 'react';
import { memo } from 'react';

import { Container } from './components/Container/Container';

interface Props {
  className?: string;
}
export const Account: FC<Props> = memo(function Account(props = {}) {
  return (
    <div>
      <Container />
    </div>
  );
});
