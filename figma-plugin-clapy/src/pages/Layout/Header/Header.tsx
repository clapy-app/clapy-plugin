import type { FC, MouseEvent } from 'react';
import { memo } from 'react';

import { HorizontalTabs as HorizontalTabsGenerator } from '../HorizontalTabs/HorizontalTabsGenerator';
import { LogoutButton } from '../LogoutButton/LogoutButton';
import classes from './Header.module.css';

interface Props {
  activeTab: number;
  selectTab: (index: number, event: MouseEvent<HTMLButtonElement>) => void;
}

export const Header: FC<Props> = memo(function Header(props) {
  const { activeTab, selectTab } = props;

  return (
    <div className={classes.root}>
      <HorizontalTabsGenerator activeTab={activeTab} selectTab={selectTab} />
      <LogoutButton />
    </div>
  );
});
