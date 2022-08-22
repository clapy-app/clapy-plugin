import IconButton from '@mui/material/IconButton/IconButton.js';
import Menu from '@mui/material/Menu/Menu.js';
import MenuItem from '@mui/material/MenuItem/MenuItem.js';
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
import { useHandleFigmaConfigs } from '../../../../../admin/admin-service.js';

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
  const throwFrontError = useCallbackAsync2(async () => {
    throw new Error('This front error must be logged on the server');
  }, []);
  const getConfigs = useHandleFigmaConfigs();
  return (
    <div className={`${classes.root} ${props.className || ''}`}>
      <IconButton
        aria-label='delete'
        id='more-settings-button'
        aria-controls={open ? 'more-settings-menu' : undefined}
        aria-haspopup='true'
        aria-expanded={open ? 'true' : undefined}
        onClick={handleClick}
      >
        <MoreHorizontalIcon className={`${classes.moreHorizontal} ${props.classes?.moreHorizontal || ''}`} />
      </IconButton>
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
        {(env.isDev || devTools) && (
          <MenuItem onClick={throwFrontError} disabled={loading}>
            Throw a front error (dev)
          </MenuItem>
        )}
        {(env.isDev || devTools) && (
          <MenuItem onClick={getConfigs} disabled={loading}>
            Generate two last registred figma Configs (dev)
          </MenuItem>
        )}
      </Menu>
    </div>
  );
});
