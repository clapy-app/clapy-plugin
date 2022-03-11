import { ChangeEventHandler, FC, memo, MouseEventHandler, useCallback, useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';

import { SbSampleSelection, StoriesSamples } from '../../backend/routes/1-import-stories/import-model';
import { handleError } from '../../common/error-utils';
import { apiGet } from '../../common/http.utils';
import { fetchPlugin, fetchPluginNoResponse, subscribePlugin } from '../../common/plugin-utils';
import { SbStoriesWrapper } from '../../common/sb-serialize.model';
import { sanitizeSbUrl } from '../../common/storybook-utils';
import { Button } from '../../components/Button';
import { useAppDispatch } from '../../core/redux/hooks';
import { env } from '../../environment/env';
import { getTokens, login } from '../auth/auth-service';
import { selectAuthLoading, selectSignedIn } from '../auth/auth-slice';
import classes from './1-ImportSb.module.scss';
import { PreviewArea } from './2-PreviewArea';
import { renderComponent } from './detail/renderComponent';
import { propArrayToMap, setSelection } from './import-slice';

export const ImportSb: FC = memo(function ImportSb() {
  const dispatch = useAppDispatch();
  const [loadingTxt, setLoadingTxt] = useState<string | undefined>();
  const [error, setError] = useState<string | undefined>();
  const loginBtn = useCallback(
    () =>
      login().catch(err => {
        handleError(err);
        setError(err?.message || 'Unknown error');
      }),
    [],
  );
  const authLoading = useSelector(selectAuthLoading);
  const isSignedIn = useSelector(selectSignedIn);
  const [sbSelection, setSbSelection] = useState<SbSampleSelection>(
    env.isDev ? 'reactstrap' /* 'equisafe' */ : 'reactstrap',
  );
  const [sbUrl, setSbUrl] = useState<string>();
  const [options, setOptions] = useState<JSX.Element[]>();
  useEffect(() => {
    getTokens()
      .then(() => {
        setError(undefined);
      })
      .catch(err => {
        handleError(err);
        setError(err?.message || 'Unknown error');
      });
  }, []);

  const storiesSamplesRef = useRef<StoriesSamples>();

  useEffect(() => {
    fetchPlugin('getStoriesSamples')
      .then(samples => {
        storiesSamplesRef.current = samples;
        setOptions(
          Object.entries(samples).map(([key, { label }]) => (
            <option key={key} value={key}>
              {label}
            </option>
          )),
        );
        setError(undefined);
      })
      .catch(err => {
        handleError(err);
        setError(err?.message || 'Unknown error');
      });
  }, []);

  const setSbSelectionHandler: ChangeEventHandler<HTMLSelectElement> = useCallback(e => {
    setSbSelection(e.target.value as SbSampleSelection);
  }, []);

  const setSbUrlHandler: ChangeEventHandler<HTMLInputElement> = useCallback(e => {
    setSbUrl(e.target.value);
  }, []);

  const interruptedRef = useRef(false);
  const [_, setInterrupted] = useState(false); // Only to re-render and enable/disable the button
  const interrupt = useCallback(() => {
    setInterrupted(true);
    interruptedRef.current = true;
  }, []);

  // Show selection
  useEffect(() => {
    const dispose = subscribePlugin('selectedSbComp', (_, nodes) => {
      dispatch(setSelection(nodes));
    });
    fetchPluginNoResponse('getSbCompSelection');
    return dispose;
  }, [dispatch]);

  // const runGrid: MouseEventHandler<HTMLButtonElement> = useCallback(() => {
  //   return fetchPlugin('runGrid');
  // }, []);

  const runImport: MouseEventHandler<HTMLButtonElement> = useCallback(() => {
    if (!storiesSamplesRef.current || (!sbSelection && !sbUrl)) {
      console.warn('Stories sample undefined or selection undefined. Cannot run import. Bug?');
      return;
    }
    let sbUrlToImport = sbUrl || storiesSamplesRef.current[sbSelection].sbUrl;
    sbUrlToImport = sanitizeSbUrl(sbUrlToImport);
    setLoadingTxt('Fetch stories available...');

    setInterrupted(false);
    interruptedRef.current = false;

    fetchStories(sbUrlToImport)
      .then(stories => {
        setLoadingTxt('Prepare stories placeholders...');
        return fetchPlugin('importStories', sbUrlToImport, stories);
      })
      .then(async insertedComponents => {
        setError(undefined);

        let consecutiveErrors = 0;
        // Could be done in parallel, with a pool to not overload the API.
        for (const { figmaId, storyUrl, storyId, pageId, argTypes, initialArgs, props } of insertedComponents) {
          try {
            if (interruptedRef.current) {
              setError('Interrupted');
              return;
            }
            const storyArgFilters = propArrayToMap(props);

            await renderComponent(
              sbUrlToImport,
              storyId,
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

            consecutiveErrors = 0;
          } catch (error) {
            console.error('Failed to render story', storyId);
            console.error(error);
            ++consecutiveErrors;
            if (consecutiveErrors >= 3) {
              throw new Error(`3 consecutive errors, stop rendering components. Exiting the loop.`);
            }
          }
        }
      })
      .catch(err => {
        handleError(err);
        setError(err?.message || 'Unknown error');
      })
      .finally(() => setLoadingTxt(undefined));
  }, [sbSelection, sbUrl]);

  const detachPage = useCallback(() => {
    fetchPlugin('detachPage').catch(handleError);
  }, []);

  if (authLoading) {
    return <p className={classes.center}>Signing in...</p>;
  }
  if (!isSignedIn) {
    return (
      <div className={classes.container}>
        <div>
          <p>
            Welcome to Clapy! After you have signed in, you will be able to import your Storybook components into a
            Figma page.
          </p>
          <p>You will need a Google account or to create an account with an email and password.</p>
        </div>
        <Button onClick={loginBtn}>Sign in</Button>
      </div>
    );
  }

  return (
    <div className={classes.container}>
      <div className={classes.topBar}>
        {!options ? (
          <p>Loading available stories...</p>
        ) : (
          <>
            <div className={classes.storybookTextInput}>
              {env.isDev && !sbUrl && (
                <select onChange={setSbSelectionHandler} defaultValue={sbSelection} disabled={!!loadingTxt}>
                  {options}
                </select>
              )}
              <input type='text' placeholder='Storybook URL' onChange={setSbUrlHandler} disabled={!!loadingTxt} />
            </div>
            <button onClick={runImport} disabled={!!loadingTxt}>
              Import
            </button>
            {/* <button onClick={runGrid} disabled={!!loadingTxt}>
              Layout
            </button> */}
          </>
        )}
      </div>
      {!!loadingTxt && (
        <>
          <div>
            <button onClick={interrupt} disabled={interruptedRef.current}>
              Interrupt
            </button>
          </div>
          <p>{loadingTxt}</p>
        </>
      )}
      {!!error && <p>{error}</p>}
      <hr />
      <PreviewArea />
      {/* {env.isDev ? <button onClick={detachPage}>Detach page</button> : null} */}
    </div>
  );
});

async function fetchStories(sbUrl: string) {
  return (await apiGet<SbStoriesWrapper>('stories/fetch-list', { query: { sbUrl } })).data;
}
