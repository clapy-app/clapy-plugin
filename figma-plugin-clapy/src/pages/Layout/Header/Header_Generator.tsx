import type { FC, MouseEvent } from 'react';
import { memo } from 'react';

import { HorizontalTabs } from '../HorizontalTabs/HorizontalTabs';
import { LogoutButton } from '../LogoutButton/LogoutButton.js';
import classes from './Header.module.css';

interface Props {
  activeTab: number;
  selectTab: (index: number, event: MouseEvent<HTMLButtonElement>) => void;
}

export const HeaderGenerator: FC<Props> = memo(function Header(props) {
  const { activeTab, selectTab } = props;

  return (
    <div className={classes.root}>
      <HorizontalTabs activeTab={activeTab} selectTab={selectTab} />
      <LogoutButton />
    </div>
  );
});
