import { Menu, MenuItem } from '@mui/material';
import Button from '@mui/material/Button';
import type { FC } from 'react';
import { memo, useCallback, useState } from 'react';
import type React from 'react';

import { logout } from '../../../../../core/auth/auth-service.js';
import classes from './Dropdown.module.css';
import { MoreHorizontalIcon } from './MoreHorizontalIcon';

interface Props {
  className?: string;
  classes?: {
    moreHorizontal?: string;
  };
}
export const Dropdown: FC<Props> = memo(function Dropdown(props = {}) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };
  const logoutBtn = useCallback(() => {
    logout();
  }, []);
  return (
    <div className={`${classes.root} ${props.className || ''}`}>
      <Button
        id='basic-button'
        aria-controls={open ? 'basic-menu' : undefined}
        aria-haspopup='true'
        aria-expanded={open ? 'true' : undefined}
        onClick={handleClick}
      >
        <MoreHorizontalIcon className={`${classes.moreHorizontal} ${props.classes?.moreHorizontal || ''}`} />
      </Button>
      <Menu
        id='basic-menu'
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        MenuListProps={{
          'aria-labelledby': 'basic-button',
        }}
      >
        <MenuItem
          onClick={() => {
            handleClose();
            logout();
          }}
        >
          Logout
        </MenuItem>
      </Menu>
    </div>
  );
});
