import { createSelector } from '@reduxjs/toolkit';
import {
  ChangeEvent,
  createRef,
  FC,
  memo,
  MouseEventHandler,
  MutableRefObject,
  RefObject,
  useCallback,
  useRef,
  useState,
} from 'react';
import { useSelector } from 'react-redux';

import { ArgTypeUsed } from '../../common/app-models';
import { handleError } from '../../common/error-utils';
import classes from './1-ImportSb.module.scss';
import { renderComponent } from './detail/renderComponent';
import { selectPropsObj, selectSelectionGuaranteed, selectSelections, selectStoryId } from './import-slice';

export const PreviewArea: FC = memo(function PreviewArea() {
  const selections = useSelector(selectSelections);
  return !selections?.length ? (
    <p>Select a component to preview the Storybook version here.</p>
  ) : selections.length > 1 ? (
    <p>Select a single node to preview the Storybook version here.</p>
  ) : (
    <PreviewAreaInner />
  );
});

const PreviewAreaInner: FC = memo(function PreviewAreaInner() {
  const selection = useSelector(selectSelectionGuaranteed);
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
        Selected: {storyLabel} (
        <a href={storyUrl} target='_blank' rel='noreferrer'>
          preview
        </a>
        )
      </div>
      <iframe title='Preview' src={storyUrl} width='300' height='200'></iframe>

      {/* Variants props */}
      {/* <VariantsProps /> */}

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

const selectPropsEntries = createSelector(selectPropsObj, propsObj =>
  propsObj ? Object.entries(propsObj) : undefined,
);

const VariantsProps: FC = memo(function VariantsProps() {
  const propsObj = useSelector(selectPropsObj);
  if (!propsObj) {
    return null;
  }
  return <VariantsPropsInner propsObj={propsObj} />;
});

const VariantsPropsInner: FC<{ propsObj: ArgTypeObj }> = memo(function VariantsPropsInner({ propsObj }) {
  const elRefs = useRef<RefObject<HTMLInputElement>[]>([]);

  const entries = useSelector(selectPropsEntries)!;
  const storyId = useSelector(selectStoryId);

  if (elRefs.current.length !== entries.length) {
    // add or remove refs
    elRefs.current = Array(entries.length)
      .fill(undefined)
      .map((_, i) => elRefs.current[i] || createRef<HTMLInputElement>());
  }

  const [hasUpdates, setHasUpdates] = useState(false);

  const applyUpdates = useCallback(() => {
    // Update node plugin data 'storyArgTypes' (node.getPluginData('storyArgTypes'))
    // Check if the selection is updated, if not emit again the selection?
    // Or update directly in the front, on the slice (not the best option).

    setHasUpdates(false);
  }, []);

  const checkChanges = useCallback(
    (hasUpdates: boolean) => {
      // TODO called multiple times with select all/none?

      const currentFormProps = getFormArgTypes(elRefs);
      const keysSelection = Object.keys(currentFormProps);
      const atLeastOnePropEnabled = !!keysSelection.find(k => currentFormProps[k]);

      const newHasUpdates = atLeastOnePropEnabled && !areSameVariantsProps(currentFormProps, propsObj);
      if (hasUpdates !== newHasUpdates) {
        setHasUpdates(newHasUpdates);
      }
    },
    [propsObj],
  );
  const changeVariant = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      checkChanges(hasUpdates);
    },
    [checkChanges, hasUpdates],
  );

  const changeAll = useCallback(
    (newValue: boolean) => {
      for (const propCheckRef of elRefs.current) {
        if (propCheckRef.current) {
          propCheckRef.current.checked = newValue;
        }
      }
      checkChanges(hasUpdates);
    },
    [checkChanges, hasUpdates],
  );
  const selectAll = useCallback(() => changeAll(true), [changeAll]);
  const unselectAll = useCallback(() => changeAll(false), [changeAll]);

  if (!entries?.length) return null;

  return (
    <div className={classes.properties}>
      <div className={classes.titleWrapper}>
        <div>
          <h4>Properties</h4>
          <p>
            <a onClick={selectAll}>Select all</a> / <a onClick={unselectAll}>unselect all</a>
          </p>
        </div>
        {hasUpdates && <button onClick={applyUpdates}>Update</button>}
      </div>
      {entries.map(([argName, used], i) => (
        <label key={storyId + argName}>
          <input
            type={'checkbox'}
            name={argName}
            defaultChecked={used}
            onChange={changeVariant}
            ref={elRefs.current[i]}
          />{' '}
          {argName}
        </label>
      ))}
    </div>
  );
});

function getFormArgTypes(elRefs: MutableRefObject<RefObject<HTMLInputElement>[]>) {
  const formSelection: ArgTypeObj = {};
  for (const elRef of elRefs.current) {
    if (elRef.current) {
      formSelection[elRef.current.name] = elRef.current.checked;
    }
  }
  return formSelection;
}

function areSameVariantsProps(
  a: ArgTypeObj | undefined,
  b: ArgTypeObj | undefined,
  keysA = a ? Object.keys(a) : undefined,
) {
  if (!a || !b || !keysA) return a == b;
  const keysB = Object.keys(b);
  if (keysA.length !== keysB.length) return false;
  // To be order-sensitive, loop on keysA and keysB on the same time and check that they have the same key at the same position.
  for (const key of keysA) {
    if (a[key] !== b[key]) return false;
  }
  return true;
}

// const arr1 = [
//   { argName: 'color', used: true },
//   { argName: 'outline', used: true },
//   { argName: 'size', used: false },
//   { argName: 'block', used: true },
//   { argName: 'active', used: true },
//   { argName: 'close', used: true },
// ];
// const arr2 = [
//   { argName: 'color', used: true },
//   { argName: 'outline', used: true },
//   { argName: 'size', used: true },
//   { argName: 'block', used: true },
//   { argName: 'active', used: true },
//   { argName: 'close', used: true },
// ];

// console.log(areSameVariantsProps(propArrayToMap(arr1), propArrayToMap(arr2)));
// console.log(propArrayToMap(arr1));

interface ArgTypeObj {
  [key: string]: boolean;
}

function propArrayToMap<T>(array: ArgTypeUsed[] | undefined) {
  if (!array) return undefined;
  const indexed: ArgTypeObj = {};
  for (const argType of array) {
    indexed[argType.argName] = argType.used;
  }
  return indexed;
}
