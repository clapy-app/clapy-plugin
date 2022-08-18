import { Badge } from '../Badge/Badge';
import classes from './BadgeGroup.module.css';

interface Props {
  isInfo?: boolean;
}

export function BadgeGroup(props: Props) {
  return (
    <div className={`${classes.root} ${props.isInfo ? classes.rootInfo : null}`}>
      <Badge isInfo={props.isInfo} />
      <div className={`${classes.message} ${props.isInfo ? classes.messageInfo : null}`}>
        {props.isInfo ? 'Professional plans are here' : 'There was a problem with that action'}
      </div>
    </div>
  );
}
