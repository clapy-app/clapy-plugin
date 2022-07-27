import type { FC, MouseEvent } from 'react';
import { memo, useCallback, useRef } from 'react';
import { useSelector } from 'react-redux';

import { Loading } from '../../../components-used/Loading/Loading.js';
import { selectUserMetadata } from '../../user/user-slice.js';
import { _TabButtonBase } from '../_TabButtonBase/_TabButtonBase';
import { CodeIcon } from '../Header/CodeIcon';
import { SettingsIcon } from '../Header/SettingsIcon';
import classes from './HorizontalTabs.module.css';

interface Props {
  activeTab: number;
  selectTab: (index: number, event: MouseEvent<HTMLButtonElement>) => void;
}

export const HorizontalTabs: FC<Props> = memo(function HorizontalTabs(props) {
  const { activeTab, selectTab } = props;
  const { picture } = useSelector(selectUserMetadata);

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
          Generator
          <span style={{ marginLeft: 8, marginTop: 4 }}>
            <CodeIcon />
          </span>
        </_TabButtonBase>
        <_TabButtonBase active={activeTab === 1} data-index={1} onClick={_selectTab}>
          {typeof picture === 'undefined' && <Loading height={24} width={24} />}
          Settings
          <span style={{ marginLeft: 8, marginTop: 3 }}>
            <SettingsIcon />
          </span>
        </_TabButtonBase>
      </div>
    </div>
  );
});
