import Button from '@mui/material/Button';
import { memo } from 'react';
import type { FC, ReactNode } from 'react';

import { ArrowLeft } from '../ArrowLeft/ArrowLeft';
import { ArrowLeftIcon } from './ArrowLeftIcon';
import classes from './PluginPageHeadline.module.css';

interface Props {
  className?: string;
  classes?: {
    root?: string;
  };
  text?: {
    pageTitle?: ReactNode;
    loremIpsumDolorSitAmetConsecte?: ReactNode;
  };
}
/* @figmaId 1899:158171 */
export const PluginPageHeadline: FC<Props> = memo(function PluginPageHeadline(props = {}) {
  return (
    <div className={`${classes.root} ${props.classes?.root || ''} ${props.className || ''}`}>
      {props.text?.pageTitle != null ? props.text?.pageTitle : <div className={classes.pageTitle}>Page title</div>}
      {props.text?.loremIpsumDolorSitAmetConsecte != null ? (
        props.text?.loremIpsumDolorSitAmetConsecte
      ) : (
        <div className={classes.loremIpsumDolorSitAmetConsecte}>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit.
        </div>
      )}
      <Button variant='text' sx={{ position: 'absolute', top: '3px', left: '0px', minWidth: '0px' }}>
        <ArrowLeft
          className={classes.arrowLeft}
          swap={{
            icon: <ArrowLeftIcon className={classes.icon} />,
          }}
        />
      </Button>
    </div>
  );
});
