import { Badge } from '../Badge/Badge';
import classes from './BadgeGroup.module.css';

interface Props {
  isInfo?: boolean;
  infoText?: string;
}
//
export function BadgeGroup(props: Props) {
  return (
    <div className={`${classes.root} ${props.isInfo ? classes.rootInfo : null}`}>
      <Badge isInfo={props.isInfo} />
      <div className={`${classes.message} ${props.isInfo ? classes.messageInfo : null}`}>
        {props.isInfo ? props.infoText : 'There was a problem with that action'}
      </div>
    </div>
  );
}
