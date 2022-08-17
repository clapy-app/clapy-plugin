import type { FC } from 'react';
import { memo } from 'react';

import animationData from '../../lotties/loading.json';
import { LottieWrapper } from '../LottieWrapper/LottieWrapper.js';

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
  return <LottieWrapper animationData={animationData} {...props} />;
});
