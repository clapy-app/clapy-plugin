import { memo } from 'react';
import type { FC, ReactNode } from 'react';

import { ArrowLeft } from '../ArrowLeft/ArrowLeft';
import { Button_SizeMdHierarchyTertiary } from '../Button_SizeMdHierarchyTertiary/Button_SizeMdHierarchyTertiary';
import { ArrowLeftIcon } from './ArrowLeftIcon';
import classes from './PluginPageHeadline.module.css';

interface Props {
  className?: string;
  text?: {
    pageTitle?: ReactNode;
    loremIpsumDolorSitAmetConsecte?: ReactNode;
  };
}
/* @figmaId 2013:133111 */
export const PluginPageHeadline: FC<Props> = memo(function PluginPageHeadline(props = {}) {
  return (
    <div className={classes.root}>
      {props.text?.pageTitle != null ? props.text?.pageTitle : <div className={classes.pageTitle}>Page title</div>}
      {props.text?.loremIpsumDolorSitAmetConsecte != null ? (
        props.text?.loremIpsumDolorSitAmetConsecte
      ) : (
        <div className={classes.loremIpsumDolorSitAmetConsecte}>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit.
        </div>
      )}
      <Button_SizeMdHierarchyTertiary
        swap={{
          circle: (
            <ArrowLeft
              className={classes.arrowLeft}
              swap={{
                icon: <ArrowLeftIcon className={classes.icon} />,
              }}
            />
          ),
        }}
      />
    </div>
  );
});
