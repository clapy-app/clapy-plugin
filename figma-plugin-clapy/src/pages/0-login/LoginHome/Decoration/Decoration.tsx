import { LottieWrapper } from '../../../../components-used/LottieWrapper/LottieWrapper.js';
import animationData from '../../../../lotties/login-home.json';
import classes from './Decoration.module.css';

const defaultOptions: any /* LottieOptions */ = {
  loop: true,
  autoplay: true,
  animationData: animationData,
  rendererSettings: {
    preserveAspectRatio: 'xMidYMid slice',
  },
};

export function Decoration() {
  return (
    <div className={classes.frame631}>
      <LottieWrapper animationData={animationData} width={144} height={144} />
    </div>
  );
}
