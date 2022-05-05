import { ButtonHTMLAttributes, FC, memo } from 'react';
import Lottie, { Options } from 'react-lottie';

import animationData from '../../../lotties/loading.json';
import classes from './_ButtonBase.module.css';

const defaultOptions: Options = {
  loop: true,
  autoplay: true,
  animationData: animationData,
  rendererSettings: {
    preserveAspectRatio: 'xMidYMid slice',
  },
};

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  disabled?: boolean;
  loading?: boolean;
  variant?: 'text';
  size?: 'medium';
};

export const _ButtonBase: FC<Props> = memo(function _ButtonBase(props) {
  const { disabled, loading, variant, size, children } = props;
  return (
    <div
      className={`${classes.root} ${disabled ? classes.disabled : ''} ${variant === 'text' ? classes.text : ''} ${
        size === 'medium' ? classes.medium : ''
      }`}
    >
      {loading && (
        <div className={classes.loading}>
          <Lottie options={defaultOptions} height={60} width={28} isClickToPauseDisabled={true} />
        </div>
      )}
      {!loading && <div className={classes.label}>{children}</div>}
    </div>
  );
});
