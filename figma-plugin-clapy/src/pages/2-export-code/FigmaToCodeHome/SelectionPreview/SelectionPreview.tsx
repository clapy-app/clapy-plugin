import type { FC } from 'react';
import { memo } from 'react';
import Lottie from 'lottie-react';

import { extractionStepsLabels, extractionStepsTotal } from '../../../../common/app-config.js';
import type { ExtractionProgress } from '../../../../common/app-models.js';
import successLottie from '../../../../lotties/gen-code-success.json';
import loadingLottie from '../../../../lotties/generating-code.json';
import type { MyStates } from '../FigmaToCodeHome';
import classes from './SelectionPreview.module.css';

interface Props {
  state: MyStates;
  selectionPreview: string | false | undefined;
  progress: ExtractionProgress | undefined;
}

function lottieOptions(animationData: any) {
  const defaultOptions: any /* LottieOptions */ = {
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
  const { state, selectionPreview, progress } = props;
  if (state === 'loading' || state === 'generated') {
    return (
      <div className={classes.rootLoading}>
        <Lottie {...(state === 'loading' ? loadingOptions : successOptions)} height={160} width={160} />
        {progress && (
          <div className={classes.loadingWrapper}>
            <div className={classes.loadingText}>
              Step {progress.stepNumber} / {extractionStepsTotal}: {extractionStepsLabels[progress.stepId]}
            </div>
            <div className={classes.loadingText}>{progress.nodeName}</div>
          </div>
        )}
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
