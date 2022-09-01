import type { LoadingButtonProps } from '@mui/lab/LoadingButton/LoadingButton.js';
import LoadingButton from '@mui/lab/LoadingButton/LoadingButton.js';
import type { FC } from 'react';
import { memo } from 'react';
import CancelIcon from '@mui/icons-material/Cancel';
import classes from './AbortableButton.module.css';
import Tooltip from '@mui/material/Tooltip/Tooltip.js';
import IconButton from '@mui/material/IconButton/IconButton.js';

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
