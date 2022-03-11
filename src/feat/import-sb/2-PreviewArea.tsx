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

import { ArgTypeObj, ArgTypeUsed } from '../../common/app-models';
import { handleError } from '../../common/error-utils';
import { isNonEmptyObject } from '../../common/general-utils';
import { fetchPlugin } from '../../common/plugin-utils';
import classes from './1-ImportSb.module.scss';
import { buildArgsMatrix } from './detail/buildArgsMatrix';
import refreshIcon from './detail/refresh-icon.svg';
import { renderComponent, renderVariant } from './detail/renderComponent';
import stopIcon from './detail/stop-icon.svg';
import {
  selectArgTypes,
  selectFigmaId,
  selectInitialArgs,
  selectPageId,
  selectSelectionGuaranteed,
  selectSelections,
  selectSelectionSbUrl,
  selectSelectionStoryLabel,
  selectStoryArgFilters,
  selectStoryId,
} from './import-slice';

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
    return /* env.isDev ? <p>Figma ID: {figmaId}</p> : */ null;
  }

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

      {!!error && <p>{error}</p>}

      {/* Variants props */}
      <VariantsProps setLoadingTxt={setLoadingTxt} />
    </>
  );
});

const selectPropsEntries = createSelector(selectStoryArgFilters, propsObj =>
  propsObj ? Object.entries(propsObj) : undefined,
);

const VariantsProps: FC<{ setLoadingTxt: SetLoadingTxt }> = memo(function VariantsProps({ setLoadingTxt }) {
  const propsObj = useSelector(selectStoryArgFilters);
  if (!propsObj) {
    return null;
  }
  return <VariantsPropsInner propsObj={propsObj} setLoadingTxt={setLoadingTxt} />;
});

const VariantsPropsInner: FC<{ propsObj: ArgTypeObj; setLoadingTxt: SetLoadingTxt }> = memo(
  function VariantsPropsInner({ propsObj, setLoadingTxt }) {
    const elRefs = useRef<RefObject<HTMLInputElement>[]>([]);

    const entries = useSelector(selectPropsEntries)!;
    const sbUrl = useSelector(selectSelectionSbUrl);
    const storyLabel = useSelector(selectSelectionStoryLabel);
    const storyId = useSelector(selectStoryId);
    const figmaId = useSelector(selectFigmaId);
    const pageId = useSelector(selectPageId);
    const argTypes = useSelector(selectArgTypes);
    const initialArgs = useSelector(selectInitialArgs);
    const [loading, setLoading] = useState(false);

    if (elRefs.current.length !== entries.length) {
      // add or remove refs
      elRefs.current = Array(entries.length)
        .fill(undefined)
        .map((_, i) => elRefs.current[i] || createRef<HTMLInputElement>());
    }

    const [hasUpdates, setHasUpdates] = useState(false);

    const applyUpdates = useCallback(() => {
      (async () => {
        try {
          if (!storyId || !argTypes) return;
          setLoading(true);

          // Update node plugin data 'storyArgFilters' (node.getPluginData('storyArgFilters'))
          // Build the new matrix with the filters
          // Check if the selection is updated, if not emit again the selection?
          // Or update directly in the front, on the slice (not the best option).
          const storyArgFilters = getFormArgTypes(elRefs);

          // TODO storyArgFilters may not be desired. We want all props to be in the matrix keys. But it should use default values for props not selected, instead of adding all values.
          const argsMatrix = buildArgsMatrix(argTypes, storyArgFilters, initialArgs);
          if (!isNonEmptyObject(argsMatrix?.[0]?.[0])) {
            return;
          }
          const newVariants = await fetchPlugin(
            'updateVariantsFromFilters',
            figmaId,
            storyId,
            pageId,
            argTypes,
            storyArgFilters,
            initialArgs,
            argsMatrix!,
          );

          for (const { i, j, args } of newVariants || []) {
            await renderVariant(
              sbUrl,
              pageId,
              figmaId,
              storyId,
              storyLabel,
              argTypes,
              initialArgs,
              args,
              i,
              j,
              setLoadingTxt,
            );
          }

          setHasUpdates(false);
        } catch (err) {
          handleError(err);
        } finally {
          setLoadingTxt(undefined);
          setLoading(false);
        }
      })();
    }, [argTypes, figmaId, initialArgs, pageId, sbUrl, setLoadingTxt, storyId, storyLabel]);

    const checkChanges = useCallback(
      (hasUpdates: boolean) => {
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
          {hasUpdates && (
            <button
              onClick={applyUpdates}
              disabled={loading}
              title='Update the variants matrix using the selected properties'
            >
              Apply
            </button>
          )}
        </div>
        {entries.map(([argName, used], i) => (
          <label key={storyId + argName} title={`Choose the properties to use to list the variants`}>
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
  },
);

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

function propArrayToMap<T>(array: ArgTypeUsed[] | undefined) {
  if (!array) return undefined;
  const indexed: ArgTypeObj = {};
  for (const argType of array) {
    indexed[argType.argName] = argType.used;
  }
  return indexed;
}

type SetLoadingTxt = (loadingText: string | undefined) => void;
