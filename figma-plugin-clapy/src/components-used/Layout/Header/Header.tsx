import { FC, memo, MouseEvent } from 'react';

import { HorizontalTabs } from '../HorizontalTabs/HorizontalTabs';
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
      <HorizontalTabs activeTab={activeTab} selectTab={selectTab} />
      <LogoutButton />
    </div>
  );
});
