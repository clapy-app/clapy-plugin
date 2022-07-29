import type { FC } from 'react';
import { memo } from 'react';

import avatarProfilePhoto from './avatarProfilePhoto.jpeg';
import classes from './AvatarProfilePhoto.module.css';

interface Props {
  className?: string;
  picture?: string;
}
export const AvatarProfilePhoto: FC<Props> = memo(function AvatarProfilePhoto(props: Props) {
  return (
    <img
      className={`${classes.root} ${props.className || ''}`}
      src={props.picture ? props.picture : avatarProfilePhoto}
      referrerPolicy='no-referrer'
    />
  );
});
