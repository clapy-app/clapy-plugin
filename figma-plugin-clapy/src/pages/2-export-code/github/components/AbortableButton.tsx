import CancelIcon from '@mui/icons-material/Cancel';
import type { LoadingButtonProps } from '@mui/lab/LoadingButton/LoadingButton.js';
import LoadingButton from '@mui/lab/LoadingButton/LoadingButton.js';
import IconButton from '@mui/material/IconButton/IconButton.js';
import Tooltip from '@mui/material/Tooltip/Tooltip.js';
import type { FC } from 'react';
import { memo } from 'react';

import classes from './AbortableButton.module.css';

interface AbortableButtonProps extends LoadingButtonProps {
  onCancel: AbortableButtonProps['onClick'];
}

export const AbortableButton: FC<AbortableButtonProps> = memo(function AbortableButton(props) {
  const { onCancel, ...btnProps } = props;
  return (
    <div>
      <LoadingButton className={classes.btn} variant='contained' {...btnProps} />
      {btnProps.loading && (
        <Tooltip title='Cancel'>
          <IconButton aria-label='cancel' onClick={onCancel}>
            <CancelIcon />
          </IconButton>
        </Tooltip>
      )}
    </div>
  );
});
//
