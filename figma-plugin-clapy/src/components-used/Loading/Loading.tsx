import type { FC } from 'react';
import { memo } from 'react';
import type { Options } from 'react-lottie';
import Lottie from 'react-lottie';

import animationData from '../../lotties/loading.json';

const defaultOptions: Options = {
  loop: true,
  autoplay: true,
  animationData: animationData,
  rendererSettings: {
    preserveAspectRatio: 'xMidYMid slice',
  },
};

export const Loading: FC = memo(function Loading() {
  return <Lottie options={defaultOptions} height={60} width={28} isClickToPauseDisabled={true} />;
});
