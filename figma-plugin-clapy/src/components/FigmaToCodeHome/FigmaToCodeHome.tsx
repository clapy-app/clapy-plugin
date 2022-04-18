import { Button } from './Button/Button';
import classes from './FigmaToCodeHome.module.css';
import { Frame59 } from './Frame59/Frame59';
import { Frame72 } from './Frame72/Frame72';

export function FigmaToCodeHome() {
  return (
    <div className={classes.root}>
      <Frame72 />
      <div className={classes.frame71}>
        <div className={classes.frame73}>
          <div className={classes.chooseTheElementYouNeedToCode}>
            Choose the element <br />
            you need to code
          </div>
        </div>
        <div className={classes.frame76}>
          <div className={classes.selectAnElementToPreviewItHere}>
            Select an element <br />
            to preview it here, <br />
            before generating its code
          </div>
        </div>
        <div className={classes.frame77}>
          <Button />
        </div>
      </div>
      <Frame59 />
    </div>
  );
}
