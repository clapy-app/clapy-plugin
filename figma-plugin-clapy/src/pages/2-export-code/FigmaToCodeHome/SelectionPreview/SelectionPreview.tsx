import type { FC } from 'react';
import { memo } from 'react';

import { extractionStepsLabels, extractionStepsTotal } from '../../../../common/app-config.js';
import type { ExtractionProgress } from '../../../../common/app-models.js';
import successLottie from '../../../../lotties/gen-code-success.json';
import loadingLottie from '../../../../lotties/generating-code.json';
import type { MyStates } from '../FigmaToCodeHome';
import classes from './SelectionPreview.module.css';
import { LottieWrapper } from '../../../../components-used/LottieWrapper/LottieWrapper.js';

interface Props {
  state: MyStates;
  selectionPreview: string | false | undefined;
  progress: ExtractionProgress | undefined;
}

export const SelectionPreview: FC<Props> = memo(function SelectionPreview(props) {
  const { state, selectionPreview, progress } = props;
  if (state === 'loading' || state === 'generated') {
    return (
      <div className={classes.rootLoading}>
        <LottieWrapper
          animationData={state === 'loading' ? loadingLottie : successLottie}
          width={120}
          height={120}
          loop={false}
        />
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
