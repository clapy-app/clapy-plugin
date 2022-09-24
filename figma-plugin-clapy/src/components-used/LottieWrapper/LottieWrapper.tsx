import type { LottieOptions } from 'lottie-react';
import Lottie from 'lottie-react';
import type { FC } from 'react';
import { memo } from 'react';

interface Props {
  animationData: LottieOptions['animationData'];
  height?: number;
  width?: number;
  loop?: boolean;
}

const rendererSettings = {
  preserveAspectRatio: 'xMidYMid slice',
};

export const LottieWrapper: FC<Props> = memo(function LottieWrapper(props) {
  const { animationData, width, height, loop = true } = props;
  return (
    <Lottie
      style={{
        width: width || 28,
        height: height || 56,
        alignSelf: 'center',
      }}
      loop={loop}
      autoplay={true}
      animationData={animationData}
      rendererSettings={rendererSettings}
    />
  );
});
