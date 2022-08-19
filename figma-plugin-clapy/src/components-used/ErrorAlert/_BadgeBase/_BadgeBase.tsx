import classes from './_BadgeBase.module.css';

interface Props {
  isInfo?: boolean;
}
export function _BadgeBase(props: Props) {
  return (
    <div className={`${classes.root} ${props.isInfo ? classes.rootInfo : null}`}>
      <div className={classes.text}>{props.isInfo ? 'Breaking news' : 'Oops!'}</div>
    </div>
  );
}
