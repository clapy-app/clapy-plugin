import Lottie from 'lottie-react';

import animationData from '../../../../lotties/code-to-design-later.json';
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
    <div className={classes.root}>
      <div className={classes.image2}>
        <Lottie {...defaultOptions} height={180} width={180} />
      </div>
    </div>
  );
}
