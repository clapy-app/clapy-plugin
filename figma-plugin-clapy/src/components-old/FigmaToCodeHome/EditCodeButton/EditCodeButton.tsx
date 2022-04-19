import { FC, memo } from 'react';

import { _ButtonBase_2 } from '../_ButtonBase_2/_ButtonBase_2';
import classes from './EditCodeButton.module.css';

interface Props {
  url: string;
}

export const EditCodeButton: FC<Props> = memo(function EditCodeButton(props) {
  const { url } = props;
  return (
    <a href={url} target='_blank' rel='noreferrer' className={classes.root}>
      <_ButtonBase_2 />
    </a>
  );
});
