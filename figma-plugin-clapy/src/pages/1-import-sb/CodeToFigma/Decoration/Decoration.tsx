import { LottieWrapper } from '../../../../components-used/LottieWrapper/LottieWrapper.js';
import animationData from '../../../../lotties/code-to-design-later.json';
import classes from './Decoration.module.css';

export function Decoration() {
  return (
    <div className={classes.root}>
      <div className={classes.image2}>
        <LottieWrapper animationData={animationData} width={180} height={180} />
      </div>
    </div>
  );
}
