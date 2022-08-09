import Lottie from 'lottie-react';
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
      <Lottie {...defaultOptions} height={144} width={144} />
    </div>
  );
}
