import { Menu, MenuItem } from '@mui/material';
import Button from '@mui/material/Button';
import type { FC } from 'react';
import { memo, useCallback, useState } from 'react';
import type React from 'react';
import { useSelector } from 'react-redux';

import { logout, refreshUser } from '../../../../../core/auth/auth-service.js';
import { selectDevTools } from '../../../../../core/auth/auth-slice.js';
import { env } from '../../../../../environment/env.js';
import { useCallbackAsync2 } from '../../../../../front-utils/front-utils.js';
import classes from './Dropdown.module.css';
import { MoreHorizontalIcon } from './MoreHorizontalIcon';

interface Props {
  className?: string;
  classes?: {
    moreHorizontal?: string;
  };
}
export const Dropdown: FC<Props> = memo(function Dropdown(props = {}) {
  const devTools = useSelector(selectDevTools);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [loading, setLoading] = useState(false);
  const open = Boolean(anchorEl);
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };
  const logoutBtn = useCallback(() => {
    handleClose();
    logout();
  }, []);
  const refreshSession = useCallbackAsync2(async () => {
    try {
      setLoading(true);
      await refreshUser();
      handleClose();
    } finally {
      setLoading(false);
    }
  }, []);
  return (
    <div className={`${classes.root} ${props.className || ''}`}>
      <Button
        id='more-settings-button'
        aria-controls={open ? 'more-settings-menu' : undefined}
        aria-haspopup='true'
        aria-expanded={open ? 'true' : undefined}
        onClick={handleClick}
      >
        <MoreHorizontalIcon className={`${classes.moreHorizontal} ${props.classes?.moreHorizontal || ''}`} />
      </Button>
      <Menu
        id='more-settings-menu'
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        MenuListProps={{
          'aria-labelledby': 'more-settings-button',
        }}
      >
        <MenuItem onClick={logoutBtn}>Logout</MenuItem>
        {(env.isDev || devTools) && (
          <MenuItem onClick={refreshSession} disabled={loading}>
            Refresh session (dev)
          </MenuItem>
        )}
      </Menu>
    </div>
  );
});
