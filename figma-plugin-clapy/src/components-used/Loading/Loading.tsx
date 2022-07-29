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
interface Props {
  height?: number;
  width?: number;
}
export const Loading: FC<Props> = memo(function Loading(props) {
  return (
    <Lottie
      options={defaultOptions}
      height={props.height || 56}
      width={props.width || 28}
      isClickToPauseDisabled={true}
    />
  );
});
