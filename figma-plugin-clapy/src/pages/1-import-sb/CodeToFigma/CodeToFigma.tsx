import classes from './CodeToFigma.module.css';
import { Decoration } from './Decoration/Decoration';

export function CodeToFigma() {
  return (
    <>
      <div className={classes.title}>
        <div className={classes.codeToFigmaWillBeBackSoon}>
          Code-to-Figma <br />
          will be back soon
        </div>
      </div>
      <Decoration />
      <div className={classes.paragraph}>
        <span className={classes.labelWrapper}>
          <span className={classes.label}>
            We are improving this feature.
            <br />
          </span>
          <a className={classes.label2} href='https://bit.ly/clapy-ds-plugin' target='_blank' rel='noreferrer'>
            Visit our Discord
          </a>
          <span className={classes.label3}>
            {' '}
            for updates <br />
            and access requests.
          </span>
        </span>
      </div>
    </>
  );
}
