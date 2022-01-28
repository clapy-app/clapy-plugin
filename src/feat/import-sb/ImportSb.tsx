import { ChangeEventHandler, FC, memo, MouseEventHandler, useCallback, useEffect, useState } from 'react';
import { CNode } from '../../backend/routes/import-sb/sb-serialize.model';
import { SbCompSelection } from '../../common/app-models';
import { handleError } from '../../common/error-utils';
import { apiGet } from '../../common/http.utils';
import { fetchPlugin, fetchPluginNoResponse, subscribePlugin } from '../../common/plugin-utils';
import classes from './ImportSb.module.scss';

const fake = () => fetchPlugin('getStoriesSamples');
type SbSelection = ReturnType<typeof fake> extends Promise<(readonly [infer Keys, string])[]> ? Keys : never;

export const ImportSb: FC = memo(() => {
  const [sbSelection, setSbSelection] = useState<SbSelection>('vibe');
  const [options, setOptions] = useState<JSX.Element[]>();

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
    fetchPlugin('importStories', sbSelection)
      .then(async (insertedComponents) => {
        // Could be done in parallel, with a pool to not overload the API.
        for (const { figmaId, url } of insertedComponents) {
          const nodes = await fetchCNodes(url);
          await fetchPlugin('updateCanvas', nodes, figmaId);
        }
      })
      .catch(handleError);
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
        : <>
          <select onChange={setSbSelectionHandler} defaultValue={sbSelection}>
            {options}
          </select>
          <button onClick={runImport}>Import</button>
        </>}</div>
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
  const { name, url, figmaId } = selection;
  const [loadingTxt, setLoadingTxt] = useState<string>();

  const runImport: MouseEventHandler<HTMLButtonElement> = useCallback(() => {
    (async () => {
      try {
        if (!url) return;
        setLoadingTxt('Serializing on API...');
        const nodes = await fetchCNodes(url);
        setLoadingTxt('Updating canvas...');
        await fetchPlugin('updateCanvas', nodes, figmaId);
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
  return (await apiGet<CNode[]>('serialize', { query: { url } })).data;
}
