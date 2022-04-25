import { FC, memo, MouseEvent, useCallback, useRef } from 'react';

import { _TabButtonBase } from '../_TabButtonBase/_TabButtonBase';
import classes from './HorizontalTabs.module.css';

interface Props {
  activeTab: number;
  selectTab: (index: number, event: MouseEvent<HTMLButtonElement>) => void;
}

export const HorizontalTabs: FC<Props> = memo(function HorizontalTabs(props) {
  const { activeTab, selectTab } = props;
  const previousIndexRef = useRef<number>();
  const _selectTab = useCallback(
    (e: MouseEvent<HTMLButtonElement>) => {
      if (e.currentTarget.dataset.index == null) return;
      const i = parseInt(e.currentTarget.dataset.index);
      if (i !== previousIndexRef.current) {
        selectTab(i, e);
        previousIndexRef.current = i;
      }
    },
    [selectTab],
  );
  return (
    <div className={classes.root}>
      <div className={classes.divider}></div>
      <div className={classes.tabs}>
        <_TabButtonBase active={activeTab === 0} data-index={0} onClick={_selectTab}>
          Figma to code
        </_TabButtonBase>
        <_TabButtonBase active={activeTab === 1} data-index={1} onClick={_selectTab}>
          Code to Figma
        </_TabButtonBase>
      </div>
    </div>
  );
});
