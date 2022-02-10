import { ChangeEventHandler, FC, memo, MouseEventHandler, useCallback, useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { SbSampleSelection, StoriesSamples } from '../../backend/routes/import-sb/import-model';
import { CNode, SbStoriesWrapper } from '../../backend/routes/import-sb/sb-serialize.model';
import { SbAnySelection } from '../../common/app-models';
import { handleError } from '../../common/error-utils';
import { apiGet } from '../../common/http.utils';
import { fetchPlugin, fetchPluginNoResponse, subscribePlugin } from '../../common/plugin-utils';
import { Button } from '../../components/Button';
import { getTokens, login } from '../auth/auth-service';
import { selectAuthLoading } from '../auth/auth-slice';
import classes from './ImportSb.module.scss';


export const ImportSb: FC = memo(() => {
  const [loadingTxt, setLoadingTxt] = useState<string | undefined>();
  const [error, setError] = useState<string | undefined>();
  const loginBtn = useCallback(() => login(), []);
  const authLoading = useSelector(selectAuthLoading);
  const [isSignedIn, setIsSignedIn] = useState<boolean>(false);
  const [sbSelection, setSbSelection] = useState<SbSampleSelection>('equisafe');
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
      .catch(err => { handleError(err); setError(err?.message || 'Unknown error'); });
  }, []);

  const storiesSamplesRef = useRef<StoriesSamples>();

  useEffect(() => {
    fetchPlugin('getStoriesSamples').then((samples) => {
      storiesSamplesRef.current = samples;
      setOptions(Object.entries(samples).map(([key, { label }]) =>
        <option key={key} value={key}>{label}</option>
      ));
      setError(undefined);
    })
      .catch(err => { handleError(err); setError(err?.message || 'Unknown error'); });
  }, []);

  const setSbSelectionHandler: ChangeEventHandler<HTMLSelectElement> = useCallback(e => {
    setSbSelection(e.target.value as SbSampleSelection);
  }, []);

  const interruptRef = useRef(false);
  const interrupt = useCallback(() => interruptRef.current = true, []);

  const runImport: MouseEventHandler<HTMLButtonElement> = useCallback(() => {
    if (!storiesSamplesRef.current || !sbSelection) {
      console.warn('Stories sample undefined or selection undefined. Cannot run import. Bug?');
      return;
    }
    const { sbUrl } = storiesSamplesRef.current[sbSelection];
    setLoadingTxt('Fetch stories available...');
    interruptRef.current = false;
    fetchStories(sbUrl)
      .then(stories => {
        setLoadingTxt('Prepare stories placeholders...');
        return fetchPlugin('importStories', sbUrl, stories);
      })
      .then(async (insertedComponents) => {
        // Could be done in parallel, with a pool to not overload the API.
        for (const { figmaId, storyUrl, storyId, pageId } of insertedComponents) {
          if (interruptRef.current) {
            setError('Interrupted');
            return;
          }
          setLoadingTxt(`Render story ${storyId}...`);
          const nodes = await fetchCNodes(storyUrl);
          await fetchPlugin('updateCanvas', nodes, figmaId, storyId, pageId);
        }

        setError(undefined);
      })
      .catch(err => { handleError(err); setError(err?.message || 'Unknown error'); })
      .finally(() => setLoadingTxt(undefined));
  }, [sbSelection]);

  // Show selection
  const [selectedSbComp, setSelectedSbComp] = useState<SbAnySelection[]>([]);
  useEffect(() => {
    const dispose = subscribePlugin('selectedSbComp', (_, nodes) => {
      setSelectedSbComp(nodes);
    });
    fetchPluginNoResponse('getSbCompSelection');
    return dispose;
  }, []);

  const detachPage = useCallback(() => {
    fetchPlugin('detachPage').catch(handleError);
  }, []);

  return (
    <div className={classes.container}>
      <div>{!options
        ? <p>Loading available stories...</p>
        : authLoading ? <p>Loading...</p> :
          !isSignedIn ? <Button onClick={loginBtn}>Auth</Button> : <>
            <select onChange={setSbSelectionHandler} defaultValue={sbSelection} disabled={!!loadingTxt}>
              {options}
            </select>
            <button onClick={runImport} disabled={!!loadingTxt}>Import</button>
          </>}</div>
      {!!loadingTxt && <><div><button onClick={interrupt}>Interrupt</button></div><p>{loadingTxt}</p></>}
      {!!error && <p>{error}</p>}
      <hr />
      {!selectedSbComp?.length
        ? <p>Select an element to preview the Storybook version here.</p>
        : selectedSbComp.length > 1
          ? <p>Select a single element to preview the Storybook version here.</p>
          : <PreviewArea selection={selectedSbComp[0]} />
      }
      <button onClick={detachPage}>Detach page</button>
    </div>
  );
});

export const PreviewArea: FC<{ selection: SbAnySelection; }> = memo(({ selection }) => {
  const { storyLabel, storyUrl, figmaId, storyId, pageId } = selection;
  const [loadingTxt, setLoadingTxt] = useState<string>();
  const [error, setError] = useState<string | undefined>();

  const runImport: MouseEventHandler<HTMLButtonElement> = useCallback(() => {
    (async () => {
      try {
        if (!storyUrl || !storyId) return;
        setLoadingTxt('Serializing on API...');
        const nodes = await fetchCNodes(storyUrl);
        setLoadingTxt('Updating canvas...');
        await fetchPlugin('updateCanvas', nodes, figmaId, storyId, pageId);
        setError(undefined);
      } catch (err) {
        handleError(err => { handleError(err); setError(err?.message || 'Unknown error'); });
      } finally {
        setLoadingTxt(undefined);
      }
    })();
  }, [storyUrl, figmaId]);

  if (!storyUrl) {
    return <p>Figma ID: {figmaId}</p>;
  }

  return <>
    <div>{storyLabel} <a href={storyUrl} target='_blank'>(preview)</a></div>
    <iframe
      title="Preview"
      src={storyUrl}
      width="300"
      height="200">
    </iframe>
    <button onClick={runImport}>Update Canvas</button>
    {loadingTxt
      ? <p>{loadingTxt}</p>
      : <>
        <p>Figma ID: {figmaId}</p>
        <p>Storybook ID: {storyId}</p>
      </>}
    {!!error && <p>{error}</p>}
  </>;
});

async function fetchCNodes(url: string) {
  return (await apiGet<CNode[]>('stories/serialize', { query: { url } })).data;
}

async function fetchStories(sbUrl: string) {
  return (await apiGet<SbStoriesWrapper>('stories/fetch-list', { query: { sbUrl } })).data;
}
