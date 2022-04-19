import { BadgeGroup } from './BadgeGroup/BadgeGroup';
import { Button } from './Button/Button';
import { Button_2 } from './Button_2/Button_2';
import classes from './ErrorAlert.module.css';

export function ErrorAlert_2() {
  return (
    <div className={classes.root}>
      <div className={classes.content}>
        <BadgeGroup />
        <div className={classes.supportingText}>Error: &#123;name_of_error&#125;</div>
      </div>
      <div className={classes.actions}>
        <Button />
        <Button_2 />
      </div>
    </div>
  );
}
