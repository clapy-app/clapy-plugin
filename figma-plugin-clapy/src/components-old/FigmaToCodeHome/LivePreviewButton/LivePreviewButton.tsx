import { FC, memo } from 'react';
import { _ButtonBase_4 } from '../_ButtonBase_4/_ButtonBase_4';
import classes from './LivePreviewButton.module.css';

interface Props {
  url: string;
}

export const LivePreviewButton: FC<Props> = memo(function LivePreviewButton(props) {
  const { url } = props;
  return (
    <a href={url} target='_blank' rel='noreferrer' className={classes.root}>
      <_ButtonBase_4 />
    </a>
  );
});
