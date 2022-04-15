import { Button } from './Button/Button';
import { Button_2 } from './Button_2/Button_2';
import { Frame57 } from './Frame57/Frame57';
import { Frame65 } from './Frame65/Frame65';
import group13Icon from './group13Icon.svg';
import classes from './LoginHome.module.css';

export function LoginHome() {
  return (
    <div className={classes.root}>
      <div className={classes.frame58}>
        <div className={classes.logoBeta}>
          <div>
            <img src={group13Icon} alt='' className={classes.group13} />
          </div>
          <div className={classes.frame54}>
            <div className={classes.frame52}>
              <div className={classes.beta}>beta</div>
            </div>
          </div>
        </div>
        <div className={classes.frame80}>
          <Frame65 />
          <div className={classes.frame60}>
            <div className={classes.signInToClapy}>Sign in to Clapy</div>
            <div className={classes.generateCleanCodeFromFigmaInstantlyReactHTMLCSS}>
              Generate clean code from Figma instantly (React, HTML, CSS).
            </div>
          </div>
          <div className={classes.frame59}>
            <Button />
            <Button_2 />
          </div>
        </div>
      </div>
      <Frame57 />
    </div>
  );
}
