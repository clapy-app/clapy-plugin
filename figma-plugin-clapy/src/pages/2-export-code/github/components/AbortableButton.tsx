import type { LoadingButtonProps } from '@mui/lab/LoadingButton/LoadingButton.js';
import LoadingButton from '@mui/lab/LoadingButton/LoadingButton.js';
import { Tooltip, IconButton } from '@mui/material';
import type { FC } from 'react';
import { memo } from 'react';
import CancelIcon from '@mui/icons-material/Cancel';
import classes from './AbortableButton.module.css';

interface AbortableButtonProps extends LoadingButtonProps {
  onCancel: AbortableButtonProps['onClick'];
}

export const AbortableButton: FC<AbortableButtonProps> = memo(function AbortableButton(props) {
  const { onCancel, ...btnProps } = props;
  return (
    <div>
      <LoadingButton className={classes.btn} {...btnProps} />
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
