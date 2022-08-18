import { _BadgeBase } from '../_BadgeBase/_BadgeBase';
import classes from './Badge.module.css';

interface Props {
  isInfo?: boolean;
}
export function Badge(props: Props) {
  return (
    <div className={classes.root}>
      <_BadgeBase isInfo={props.isInfo} />
    </div>
  );
}
