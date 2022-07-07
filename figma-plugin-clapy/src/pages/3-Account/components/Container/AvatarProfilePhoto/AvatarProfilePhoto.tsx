import { FC, memo } from 'react';

import classes from './AvatarProfilePhoto.module.css';

interface Props {
  className?: string;
}
export const AvatarProfilePhoto: FC<Props> = memo(function AvatarProfilePhoto(props = {}) {
  return <div className={`${classes.root} ${props.className || ''}`}></div>;
});
