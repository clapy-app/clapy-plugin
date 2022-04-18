import { Button } from './Button/Button';
import classes from './FigmaToCodeHome.module.css';
import { Footer } from './Footer/Footer';
import { Header } from './Header/Header';

export function FigmaToCodeHome2() {
  return (
    <div className={classes.root}>
      <Header />
      <div className={classes.content}>
        <div className={classes.previewTitleBlock}>
          <div className={classes.previewTitleLabel}>
            Choose the element <br />
            you need to code
          </div>
        </div>
        <div className={classes.selectionPreview}>
          <div className={classes.previewPlaceholder}>
            Select an element <br />
            to preview it here, <br />
            before generating its code
          </div>
        </div>
        <div className={classes.genCode}>
          <Button />
        </div>
      </div>
      <Footer />
    </div>
  );
}
