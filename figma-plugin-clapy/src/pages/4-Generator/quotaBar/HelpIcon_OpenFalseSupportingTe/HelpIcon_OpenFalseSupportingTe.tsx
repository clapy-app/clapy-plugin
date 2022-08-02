import { memo } from 'react';
import type { FC } from 'react';

import { HelpCircle } from '../HelpCircle/HelpCircle';
import { HelpCircleIcon } from './HelpCircleIcon';
import classes from './HelpIcon_OpenFalseSupportingTe.module.css';

interface Props {
  className?: string;
}
/* @figmaId 2027:135018 */
export const HelpIcon_OpenFalseSupportingTe: FC<Props> = memo(function HelpIcon_OpenFalseSupportingTe(props = {}) {
  return (
    <div className={classes.root}>
      <HelpCircle
        className={classes.helpCircle}
        swap={{
          icon: <HelpCircleIcon className={classes.icon} />,
        }}
      />
    </div>
  );
});
