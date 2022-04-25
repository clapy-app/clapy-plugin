import { FC, memo, MouseEventHandler, useCallback, useRef, useState } from 'react';
import { useSelector } from 'react-redux';

import { handleError } from '../../common/error-utils';
import classes from './1-ImportSb.module.scss';
import { VariantsProps } from './3-VariantsProps';
import refreshIcon from './detail/refresh-icon.svg';
import { renderComponent } from './detail/renderComponent';
import stopIcon from './detail/stop-icon.svg';
import { selectSelectionGuaranteed, selectSelections, selectStoryArgFilters } from './import-slice';

export const PreviewArea: FC = memo(function PreviewArea() {
  const selections = useSelector(selectSelections);
  return !selections?.length ? (
    <p>Select a component imported with Clapy to preview the Storybook version.</p>
  ) : selections.length > 1 ? (
    <p>Select a single node to preview the Storybook version.</p>
  ) : (
    <PreviewAreaInner />
  );
});

const PreviewAreaInner: FC = memo(function PreviewAreaInner() {
  const selection = useSelector(selectSelectionGuaranteed);
  const storyArgFilters = useSelector(selectStoryArgFilters);
  const { storyLabel, sbUrl, storyUrl, figmaId, storyId, pageId, argTypes, initialArgs } = selection;
  const [loadingTxt, setLoadingTxt] = useState<string>();
  const [error, setError] = useState<string | undefined>();

  const interruptedRef = useRef(false);
  const [_, setInterrupted] = useState(false); // Only to re-render and enable/disable the button
  const interrupt = useCallback(() => {
    setInterrupted(true);
    interruptedRef.current = true;
  }, []);

  const runUpdate: MouseEventHandler<HTMLButtonElement> = useCallback(() => {
    (async () => {
      try {
        if (!storyUrl || !storyId || !storyLabel || !sbUrl || !argTypes || !initialArgs) return;

        setInterrupted(false);
        interruptedRef.current = false;

        await renderComponent(
          sbUrl,
          storyId,
          storyLabel,
          argTypes,
          storyArgFilters,
          initialArgs,
          storyUrl,
          figmaId,
          pageId,
          setLoadingTxt,
          interruptedRef,
        );
        if (interruptedRef.current) {
          setError('Interrupted');
          return;
        }

        // setLoadingTxt('Serializing on API...');
        // const nodes = await fetchCNodes(storyUrl);
        // setLoadingTxt('Updating canvas...');
        // await fetchPlugin('updateCanvas', nodes, figmaId, storyId, pageId);

        setError(undefined);
      } catch (err: any) {
        handleError(err);
        setError(err?.message || 'Unknown error');
      } finally {
        setLoadingTxt(undefined);
      }
    })();
  }, [storyUrl, storyId, storyLabel, sbUrl, argTypes, initialArgs, storyArgFilters, figmaId, pageId]);

  if (!storyUrl) {
    // <p>Figma ID: {figmaId}</p>
    return (
      <div>
        <p>We couldn’t identify this component. Please select a component imported from Storybook with Clapy.</p>
        <p>
          If you have any question, please {/* Mail link generated with https://mailtolink.me/ */}{' '}
          <a
            href={
              "mailto:support@clapy.co?subject=Question%20about%20Clapy&body=Hi%20Clapy%20team%2C%0D%0A%0D%0AI'm%20currently%20using%20your%20Figma%20plugin%20and%20I%20have%20a%20question.%0D%0A%0D%0AXXX"
            }
            target='_blank'
            rel='noreferrer'
          >
            contact us
          </a>
          .
        </p>
      </div>
    );
  }
  // “Sorry, we couldn’t identify this component.
  // Please select a component imported from Storybook with Clapy.

  // If you have any question, contact us.” (mail to support@clapy.co)

  return (
    <>
      <div className={classes.selectTitleBar}>
        <div>
          Selected: {storyLabel} (
          <a href={storyUrl} target='_blank' rel='noreferrer' title='Open the storybook preview in a browser tab'>
            preview
          </a>
          )
        </div>
        {/* Update button */}
        {loadingTxt ? (
          <button onClick={interrupt} disabled={interruptedRef.current} title='Interrupt' className={classes.iconBtn}>
            <img src={stopIcon} alt='Interrupt' />
          </button>
        ) : (
          <button onClick={runUpdate} title='Reload component from Storybook' className={classes.iconBtn}>
            <img src={refreshIcon} alt='Reload component from Storybook' />
          </button>
        )}
      </div>
      <iframe title='Preview' src={storyUrl} className={classes.previewIframe}></iframe>

      {loadingTxt && <p>{loadingTxt}</p>}

      {!!error && (
        <p>
          {error !== 'Interrupted' && (
            <>
              Oops, something went wrong! Please retry later or contact us if the problem persists. The error message
              {/* Mail link generated with https://mailtolink.me/ */}{' '}
              <a
                href={`mailto:support@clapy.co?subject=Reporting%20an%20error%20I%20faced%20using%20Clapy&body=Hi%20Clapy%20team%2C%0D%0A%0D%0AI%20faced%20the%20following%20error%20while%20using%20the%20Clapy%3A%0D%0A%0D%0A${JSON.stringify(
                  error,
                )}%0D%0A%0D%0AHere%20are%20the%20steps%20to%20reproduce%3A%0D%0A%0D%0A-%20XXX%0D%0A-%20XXX`.substring(
                  0,
                  1800,
                )}
                target='_blank'
                rel='noreferrer'
              >
                you can send us
              </a>
              :{' '}
            </>
          )}
          <em>{error}</em>
        </p>
      )}

      {/* Variants props */}
      <VariantsProps setLoadingTxt={setLoadingTxt} />
    </>
  );
});
