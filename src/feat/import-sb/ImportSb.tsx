import { ChangeEventHandler, FC, memo, MouseEventHandler, useCallback, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { CNode } from '../../backend/routes/import-sb/sb-serialize.model';
import { SbCompSelection } from '../../common/app-models';
import { handleError } from '../../common/error-utils';
import { apiGet } from '../../common/http.utils';
import { fetchPlugin, fetchPluginNoResponse, subscribePlugin } from '../../common/plugin-utils';
import { Button } from '../../components/Button';
import { getTokens, login } from '../auth/auth-service';
import { selectAuthLoading } from '../auth/auth-slice';
import classes from './ImportSb.module.scss';

const fake = () => fetchPlugin('getStoriesSamples');
type SbSelection = ReturnType<typeof fake> extends Promise<(readonly [infer Keys, string])[]> ? Keys : never;

export const ImportSb: FC = memo(() => {
  const [loadingTxt, setLoadingTxt] = useState<string | undefined>();
  const loginBtn = useCallback(() => login(), []);
  const authLoading = useSelector(selectAuthLoading);
  const [isSignedIn, setIsSignedIn] = useState<boolean>(false);
  const [sbSelection, setSbSelection] = useState<SbSelection>('reactstrap');
  const [options, setOptions] = useState<JSX.Element[]>();
  useEffect(() => {
    getTokens()
      .then(({ accessToken }) => {
        const _isSignedIn = !!accessToken;
        if (isSignedIn !== _isSignedIn) {
          setIsSignedIn(_isSignedIn);
        }
      })
      .catch(handleError);
  }, []);

  useEffect(() => {
    const storiesSamplesP = fetchPlugin('getStoriesSamples');
    storiesSamplesP
      .then((samples) => {
        setOptions(samples.map(([key, label]) =>
          <option key={key} value={key}>{label}</option>
        ));
      })
      .catch(handleError);
  }, []);

  const setSbSelectionHandler: ChangeEventHandler<HTMLSelectElement> = useCallback(e => {
    setSbSelection(e.target.value as SbSelection);
  }, []);
  const runImport: MouseEventHandler<HTMLButtonElement> = useCallback(() => {
    setLoadingTxt('Prepare stories placeholders...');
    fetchPlugin('importStories', sbSelection)
      .then(async (insertedComponents) => {
        // Could be done in parallel, with a pool to not overload the API.
        for (const { figmaId, url, storyId } of insertedComponents) {
          setLoadingTxt(`Render story ${storyId}...`);
          const nodes = await fetchCNodes(url);
          await fetchPlugin('updateCanvas', nodes, figmaId, storyId);
        }
      })
      .catch(handleError)
      .finally(() => setLoadingTxt(undefined));
  }, [sbSelection]);

  // Show selection
  const [selectedSbComp, setSelectedSbComp] = useState<SbCompSelection[]>([]);
  useEffect(() => {
    const dispose = subscribePlugin('selectedSbComp', (_, nodes) => {
      setSelectedSbComp(nodes);
    });
    fetchPluginNoResponse('getSbCompSelection');
    return dispose;
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
      {!!loadingTxt && <p>{loadingTxt}</p>}
      <hr />
      {!selectedSbComp?.length
        ? <p>Select an element to preview the Storybook version here.</p>
        : selectedSbComp.length > 1
          ? <p>Select a single element to preview the Storybook version here.</p>
          : <PreviewArea selection={selectedSbComp[0]} />
      }
    </div>
  );
});

export const PreviewArea: FC<{ selection: SbCompSelection; }> = memo(({ selection }) => {
  const { name, url, figmaId, id: storyId } = selection;
  const [loadingTxt, setLoadingTxt] = useState<string>();

  const runImport: MouseEventHandler<HTMLButtonElement> = useCallback(() => {
    (async () => {
      try {
        if (!url || !storyId) return;
        setLoadingTxt('Serializing on API...');
        const nodes = await fetchCNodes(url);
        setLoadingTxt('Updating canvas...');
        await fetchPlugin('updateCanvas', nodes, figmaId, storyId);
      } catch (err) {
        handleError(err);
      } finally {
        setLoadingTxt(undefined);
      }
    })();
  }, [url, figmaId]);

  if (!url) {
    return <p>Figma ID: {figmaId}</p>;
  }

  return <>
    <div>{name} <a href={url} target='_blank'>(preview)</a></div>
    <iframe
      title="Preview"
      src={url}
      width="300"
      height="200">
    </iframe>
    <button onClick={runImport}>Update Canvas</button>
    {loadingTxt
      ? <p>{loadingTxt}</p>
      : <p>Figma ID: {figmaId}</p>}
  </>;
});

async function fetchCNodes(url: string) {
  return (await apiGet<CNode[]>('stories/serialize', { query: { url } })).data;
}
