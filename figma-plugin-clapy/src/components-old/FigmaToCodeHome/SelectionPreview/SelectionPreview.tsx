import { FC, memo } from 'react';
import Lottie, { Options } from 'react-lottie';

import animationData from '../../../lotties/generating-code.json';
import { MyStates } from '../FigmaToCodeHome';
import classes from './SelectionPreview.module.css';

interface Props {
  state: MyStates;
  selectionPreview: string | false | undefined;
}

const defaultOptions: Options = {
  loop: true,
  autoplay: true,
  animationData: animationData,
  rendererSettings: {
    preserveAspectRatio: 'xMidYMid slice',
  },
};

export const SelectionPreview: FC<Props> = memo(function SelectionPreview(props) {
  const { state, selectionPreview } = props;
  if (state === 'loading') {
    return (
      <div className={classes.rootLoading}>
        <Lottie options={defaultOptions} height={180} width={180} />
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
      {(state === 'selection' || state === 'generated') && (
        <img src={selectionPreview || undefined} alt='' className={classes.previewPlaceholderImage} />
      )}
    </div>
  );
});
