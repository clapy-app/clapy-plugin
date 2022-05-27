import { FC, memo } from 'react';
import Lottie, { Options } from 'react-lottie';

import successLottie from '../../../../lotties/gen-code-success.json';
import loadingLottie from '../../../../lotties/generating-code.json';
import { MyStates } from '../FigmaToCodeHome';
import classes from './SelectionPreview.module.css';

interface Props {
  state: MyStates;
  selectionPreview: string | false | undefined;
}

function lottieOptions(animationData: any) {
  const defaultOptions: Options = {
    loop: false,
    autoplay: true,
    animationData: animationData,
    rendererSettings: {
      preserveAspectRatio: 'xMidYMid slice',
    },
  };
  return defaultOptions;
}

const loadingOptions = lottieOptions(loadingLottie);
const successOptions = lottieOptions(successLottie);

export const SelectionPreview: FC<Props> = memo(function SelectionPreview(props) {
  const { state, selectionPreview } = props;
  if (state === 'loading' || state === 'generated') {
    return (
      <div className={classes.rootLoading}>
        <Lottie options={state === 'loading' ? loadingOptions : successOptions} height={180} width={180} />
      </div>
    );
  }
  return (
    <div className={classes.root}>
      {state === 'noselection' && (
        <div className={classes.previewPlaceholderText}>
          Select an element <br />
          to preview it here, <br />
          before generating its code
        </div>
      )}
      {state === 'selectionko' && <>Preview unavailable for this selection</>}
      {state === 'selection' && (
        <img src={selectionPreview || undefined} alt='' className={classes.previewPlaceholderImage} />
      )}
    </div>
  );
});
