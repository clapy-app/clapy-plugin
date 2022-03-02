import {
  ChangeEventHandler,
  FC,
  memo,
  MouseEventHandler,
  MutableRefObject,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { useSelector } from 'react-redux';
import { Args, ArgTypes, CNode, SbStoriesWrapper } from '../../backend/common/sb-serialize.model';
import { SbSampleSelection, StoriesSamples } from '../../backend/routes/1-import-stories/import-model';
import { SbAnySelection } from '../../common/app-models';
import { handleError } from '../../common/error-utils';
import { apiGet } from '../../common/http.utils';
import { fetchPlugin, fetchPluginNoResponse, subscribePlugin } from '../../common/plugin-utils';
import { sanitizeSbUrl } from '../../common/storybook-utils';
import { Button } from '../../components/Button';
import { env } from '../../environment/env';
import { getTokens, login, logout } from '../auth/auth-service';
import { selectAuthLoading } from '../auth/auth-slice';
import classes from './ImportSb.module.scss';

export const ImportSb: FC = memo(() => {
  const [loadingTxt, setLoadingTxt] = useState<string | undefined>();
  const [error, setError] = useState<string | undefined>();
  const loginBtn = useCallback(
    () =>
      login()
        .then(() => setIsSignedIn(true))
        .catch(err => {
          handleError(err);
          setError(err?.message || 'Unknown error');
        }),
    [],
  );
  const logoutBtn = useCallback(() => {
    logout();
    setIsSignedIn(false);
  }, []);
  const authLoading = useSelector(selectAuthLoading);
  const [isSignedIn, setIsSignedIn] = useState<boolean>(false);
  const [sbSelection, setSbSelection] = useState<SbSampleSelection>(
    env.isDev ? 'reactstrap' /* 'equisafe' */ : 'reactstrap',
  );
  const [sbUrl, setSbUrl] = useState<string>();
  const [options, setOptions] = useState<JSX.Element[]>();
  useEffect(() => {
    getTokens()
      .then(({ accessToken }) => {
        const _isSignedIn = !!accessToken;
        if (isSignedIn !== _isSignedIn) {
          setIsSignedIn(_isSignedIn);
        }
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
  const [selectedSbComp, setSelectedSbComp] = useState<SbAnySelection[]>([]);
  useEffect(() => {
    const dispose = subscribePlugin('selectedSbComp', (_, nodes) => {
      setSelectedSbComp(nodes);
    });
    fetchPluginNoResponse('getSbCompSelection');
    return dispose;
  }, []);

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
        for (const { figmaId, storyUrl, storyId, pageId, argTypes } of insertedComponents) {
          try {
            if (interruptedRef.current) {
              setError('Interrupted');
              return;
            }

            await renderComponent(
              sbUrlToImport,
              storyId,
              argTypes,
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

  return (
    <div className={classes.container}>
      <div className={classes.topBar}>
        {!options ? (
          <p>Loading available stories...</p>
        ) : authLoading ? (
          <p>Loading...</p>
        ) : !isSignedIn ? (
          <Button onClick={loginBtn}>Auth</Button>
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
      {!selectedSbComp?.length ? (
        <p>Select a component to preview the Storybook version here.</p>
      ) : selectedSbComp.length > 1 ? (
        <p>Select a single node to preview the Storybook version here.</p>
      ) : (
        <PreviewArea selection={selectedSbComp[0]} />
      )}
      {/* {env.isDev ? <button onClick={detachPage}>Detach page</button> : null} */}
      {isSignedIn && (
        <button className={classes.textButton} onClick={logoutBtn}>
          Logout
        </button>
      )}
    </div>
  );
});

export const PreviewArea: FC<{ selection: SbAnySelection }> = memo(({ selection }) => {
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
  }, [storyUrl, figmaId]);

  if (!storyUrl) {
    return /* env.isDev ? <p>Figma ID: {figmaId}</p> : */ null;
  }

  return (
    <>
      <div>
        Selected: {storyLabel}{' '}
        <a href={storyUrl} target='_blank'>
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
        /* env.isDev ? (
        <>
          <p>Figma ID: {figmaId}</p>
          <p>Storybook ID: {storyId}</p>
        </>
      ) : */
        <button onClick={runImport}>Update component</button>
      )}
      {!!error && <p>{error}</p>}
    </>
  );
});

async function fetchCNodes(url: string) {
  return (await apiGet<CNode[]>('stories/serialize', { query: { url } })).data;
}

async function fetchStories(sbUrl: string) {
  return (await apiGet<SbStoriesWrapper>('stories/fetch-list', { query: { sbUrl } })).data;
}

async function renderComponent(
  sbUrl: string,
  storyId: string,
  argTypes: ArgTypes,
  storyUrl: string,
  figmaId: string,
  pageId: string,
  setLoadingTxt: (label: string) => void,
  interruptedRef: MutableRefObject<boolean>,
) {
  if (!env.isDev) {
    setLoadingTxt(`Render story ${storyId}...`);
  }

  const argsMatrix = buildArgsMatrix(argTypes);
  if (argsMatrix) {
    // Render each variant
    for (let i = 0; i < argsMatrix.length; i++) {
      const row = argsMatrix[i];
      for (let j = 0; j < row.length; j++) {
        if (interruptedRef.current) {
          return;
        }

        const args = row[j];
        const query = Object.entries(args)
          .map(([key, value]) => `${key}:${value}`)
          .join(';');
        const url = `${sbUrl}/iframe.html?id=${storyId}&viewMode=story&args=${query}`;
        if (env.isDev) {
          setLoadingTxt(`Render story ${storyId} variant (web)...`);
        }
        const nodes = await fetchCNodes(url);
        if (env.isDev) {
          setLoadingTxt(`Render story ${storyId} variant (figma)...`);
        }
        const newFigmaId = await fetchPlugin(
          'updateCanvasVariant',
          nodes,
          figmaId,
          sbUrl,
          storyId,
          pageId,
          argTypes,
          args,
          i,
          j,
        );
        if (newFigmaId) {
          figmaId = newFigmaId; // TODO tester
        }
      }
    }
  } else {
    if (env.isDev) {
      setLoadingTxt(`Render story ${storyId} (web)...`);
    }

    // Render the story in the API in web format via puppeteer and get HTML/CSS
    const nodes = await fetchCNodes(storyUrl);

    if (env.isDev) {
      setLoadingTxt(`Render story ${storyId} (figma)...`);
    }

    // Render in Figma, translating HTML/CSS to Figma nodes
    await fetchPlugin('updateCanvas', nodes, figmaId, storyId, pageId);
  }
}

function buildArgsMatrix(argTypes: ArgTypes) {
  let argsMatrix: Args[][] | undefined = undefined;
  let i = -1;
  for (const [argName, argType] of Object.entries(argTypes)) {
    // TODO dev filter to remove later.
    // if (argName !== 'active' && argName !== 'outline') {
    //   continue;
    // }
    if (argType.control?.type !== 'boolean') {
      continue;
    }
    ++i;
    const columnDirection = i % 2 === 0;

    if (!argsMatrix) {
      argsMatrix = [[{}]];
    }

    // [[ {} ]]

    // [[ {a: false}, {a: true} ]]

    // [[ {a: false, d: false}, {a: true, d: false} ],
    //  [ {a: false, d: true}, {a: true, d: true} ]]

    // [[ {a: false, d: false, o: false}, {a: true, d: false, o: false}, {a: false, d: false, o: true}, {a: true, d: false, o: true} ],
    //  [ {a: false, d: true, o: false}, {a: true, d: true, o: false}, {a: false, d: true, o: true}, {a: true, d: true, o: true} ]]

    if (argType.control.type === 'boolean') {
      if (columnDirection) {
        for (const row of argsMatrix) {
          for (const args of [...row]) {
            Object.assign(args, { [argName]: false });
            row.push({ ...args, [argName]: true });
          }
        }
      } else {
        for (const row of [...argsMatrix]) {
          const newRow: Args[] = [];
          argsMatrix.push(newRow);
          for (const args of row) {
            Object.assign(args, { [argName]: false });
            newRow.push({ ...args, [argName]: true });
          }
        }
      }
    }
  }
  return argsMatrix;
}
