import Tooltip from '@mui/material/Tooltip';
import type { FC, MouseEvent } from 'react';
import { memo, useCallback } from 'react';

import classes from './AccountButton.module.css';
import { AccountIcon } from './AccountIcon';

interface Props {
  activeTab: number;
  selectTab: (index: number, event: MouseEvent<HTMLButtonElement>) => void;
}

export const AccountButton: FC<Props> = memo(function AccountButton(props) {
  const { activeTab, selectTab } = props;

  const moveToAccount = useCallback(
    (e: MouseEvent<HTMLButtonElement>) => {
      const toAccountPage = (e: MouseEvent<HTMLButtonElement>) => {
        if (e.currentTarget.dataset.index == null) return;
        const i = parseInt(e.currentTarget.dataset.index);
        selectTab(i, e);
      };
      toAccountPage(e);
      //a new function that will redirect user to page
    },
    [selectTab],
  );
  return (
    <Tooltip title='Account'>
      <button data-index={2} onClick={moveToAccount}>
        <div className={classes.buttonBase}>
          <AccountIcon className={classes.account} />
        </div>
        <div className={classes.rectangle11}></div>
      </button>
    </Tooltip>
  );
});
