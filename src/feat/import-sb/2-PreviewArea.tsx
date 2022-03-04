import { ChangeEvent, FC, memo, MouseEventHandler, useCallback, useRef, useState } from 'react';

import { ArgTypeUsed, SbAnySelection } from '../../common/app-models';
import { handleError } from '../../common/error-utils';
import classes from './1-ImportSb.module.scss';
import { renderComponent } from './detail/renderComponent';

export const PreviewArea: FC<{ selection: SbAnySelection }> = memo(function PreviewArea({ selection }) {
  const { storyLabel, sbUrl, storyUrl, figmaId, storyId, pageId, argTypes } = selection;
  const [loadingTxt, setLoadingTxt] = useState<string>();
  const [error, setError] = useState<string | undefined>();

  const interruptedRef = useRef(false);
  const [_, setInterrupted] = useState(false); // Only to re-render and enable/disable the button
  const interrupt = useCallback(() => {
    setInterrupted(true);
    interruptedRef.current = true;
  }, []);

  const runImport: MouseEventHandler<HTMLButtonElement> = useCallback(() => {
    (async () => {
      try {
        if (!storyUrl || !storyId || !sbUrl || !argTypes) return;

        setInterrupted(false);
        interruptedRef.current = false;

        await renderComponent(sbUrl, storyId, argTypes, storyUrl, figmaId, pageId, setLoadingTxt, interruptedRef);
        if (interruptedRef.current) {
          setError('Interrupted');
          return;
        }

        // setLoadingTxt('Serializing on API...');
        // const nodes = await fetchCNodes(storyUrl);
        // setLoadingTxt('Updating canvas...');
        // await fetchPlugin('updateCanvas', nodes, figmaId, storyId, pageId);

        setError(undefined);
      } catch (err) {
        handleError((err: any) => {
          handleError(err);
          setError(err?.message || 'Unknown error');
        });
      } finally {
        setLoadingTxt(undefined);
      }
    })();
  }, [storyUrl, storyId, sbUrl, argTypes, figmaId, pageId]);

  if (!storyUrl) {
    return /* env.isDev ? <p>Figma ID: {figmaId}</p> : */ null;
  }

  return (
    <>
      <div>
        Selected: {storyLabel}{' '}
        <a href={storyUrl} target='_blank' rel='noreferrer'>
          (preview)
        </a>
      </div>
      <iframe title='Preview' src={storyUrl} width='300' height='200'></iframe>

      {/* Variants props */}
      <VariantsProps selection={selection} />

      {/* Update button */}
      {loadingTxt ? (
        <>
          <div>
            <button onClick={interrupt} disabled={interruptedRef.current}>
              Interrupt
            </button>
          </div>
          <p>{loadingTxt}</p>
        </>
      ) : (
        <button onClick={runImport}>Update component</button>
      )}
      {/* !!loadingTxt && env.isDev ? (
        <>
          <p>Figma ID: {figmaId}</p>
          <p>Storybook ID: {storyId}</p>
        </>
      ) : */}
      {!!error && <p>{error}</p>}
    </>
  );
});

const VariantsProps: FC<{ selection: SbAnySelection }> = memo(function VariantsProps({ selection }) {
  const { props } = selection;
  const [hasChanged, setHasChanged] = useState(false);
  const previousRef = useRef<ArgTypeUsed[]>();
  const changeVariant = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      if (!hasChanged && !areSameVariantsProps(previousRef.current, props)) {
        previousRef.current = props;
        setHasChanged(true);
      }
    },
    [hasChanged, props],
  );
  if (!props?.length) return null;
  console.log('props:', props);
  return (
    <div className={classes.properties}>
      <div className={classes.titleWrapper}>
        <h3>Properties</h3>
        {hasChanged && <button>Update</button>}
      </div>
      {props.map(({ argName, used }) => (
        <label key={argName}>
          <input type={'checkbox'} defaultChecked={used} onChange={changeVariant} /> {argName}
        </label>
      ))}
    </div>
  );
});

function areSameVariantsProps(a: ArgTypeUsed[] | undefined, b: ArgTypeUsed[] | undefined) {
  if (!a && !b) return true;
  if (!a || !b || a?.length !== b?.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i].argName !== b[i].argName || a[i].used !== b[i].used) return false;
  }
  return true;
}
