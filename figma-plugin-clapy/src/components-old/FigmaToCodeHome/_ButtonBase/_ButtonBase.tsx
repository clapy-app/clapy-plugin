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
};

export const _ButtonBase: FC<Props> = memo(function _ButtonBase(props) {
  const { disabled, loading, children } = props;
  return (
    <div className={`${classes.root} ${disabled ? classes.disabled : ''}`}>
      {loading && (
        <div className={classes.loading}>
          <Lottie options={defaultOptions} height={60} width={28} />
        </div>
      )}
      {!loading && <div className={classes.text}>{children}</div>}
    </div>
  );
});
