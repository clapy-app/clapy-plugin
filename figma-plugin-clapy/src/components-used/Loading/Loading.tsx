import type { FC } from 'react';
import { memo } from 'react';
import Lottie from 'lottie-react';

import animationData from '../../lotties/loading.json';

const defaultOptions: any /* LottieOptions */ = {
  loop: true,
  autoplay: true,
  animationData: animationData,
  rendererSettings: {
    preserveAspectRatio: 'xMidYMid slice',
  },
};
interface Props {
  height?: number;
  width?: number;
}
export const Loading: FC<Props> = memo(function Loading(props) {
  return (
    <Lottie
      // loop={true}
      // autoplay={true}
      // animationData={animationData}
      // rendererSettings={true}
      {...defaultOptions}
      height={props.height || 56}
      width={props.width || 28}
      isClickToPauseDisabled={true}
    />
  );
});
