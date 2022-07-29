import { memo } from 'react';
import type { FC } from 'react';

import { FooterInner } from './components/FooterInner';
import classes from './Footer.module.css';

interface Props {
  className?: string;
}
export const Footer: FC<Props> = memo(function Footer(props = {}) {
  return (
    <div className={classes.root}>
      <FooterInner />
    </div>
  );
});
