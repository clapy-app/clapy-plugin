import { FC, memo, MouseEventHandler, useCallback, useRef, useState } from 'react';

import { SbAnySelection } from '../../common/app-models';
import { handleError } from '../../common/error-utils';
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
