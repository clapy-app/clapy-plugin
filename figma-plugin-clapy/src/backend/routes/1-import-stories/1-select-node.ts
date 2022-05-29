import type { NextFn, SbAnySelection, SbCompSelection, SbOtherSelection } from '../../../common/app-models';
import type { ArgTypes, Dict } from '../../../common/sb-serialize.model';
import { sbUrlIframe } from '../../../common/storybook-utils';
import { isComponentSet, isInstance } from '../../common/node-type-utils';
import { getFigmaSelection } from '../../common/selection-utils';
import { getParentCompNode, listVariantProps } from './import-sb-utils';

export async function getSbCompSelection() {
  sendSbCompSelection?.();
}

// Subscription

let sendSbCompSelection: (() => void) | undefined;

export function selectedSbComp(next: NextFn<SbAnySelection[]>) {
  sendSbCompSelection = () => next(prepareSbCompSelection());
  figma.on('selectionchange', sendSbCompSelection);
  // Initial emit, for dev, when the figma plugin is open after the webapp.
  sendSbCompSelection();
}

function prepareSbCompSelection() /* : SbCompSelection[] */ {
  const selectedSbComp = getFigmaSelection().reduce((selections, selectedNode) => {
    const { node, sbUrl, storyId } = getParentCompNode(selectedNode);
    if (storyId && sbUrl && node) {
      // &args=kind:secondary;size:xxs
      const storyUrl = `${sbUrlIframe(sbUrl)}?id=${storyId}&viewMode=story`;
      const argTypes: ArgTypes = JSON.parse(node.getPluginData('storyArgTypes') || '{}');
      const initialArgs: ArgTypes = JSON.parse(node.getPluginData('storyInitialArgs') || '{}');
      const selection: SbCompSelection = {
        storyId,
        storyLabel: node.name,
        sbUrl,
        storyUrl,
        argTypes,
        initialArgs,
        figmaId: node.id,
        tagFigmaId: selectedNode.id,
        pageId: figma.currentPage.id,
        props: listVariantProps(node, argTypes),
      };
      selections.push(selection);
    } else {
      const selection: SbOtherSelection = {
        figmaId: selectedNode.id,
        pageId: figma.currentPage.id,
      };
      selections.push(selection);
    }
    return selections;
  }, [] as SbAnySelection[]);
  // To log the selection flex config:
  if (selectedSbComp.length === 1) {
    show(figma.getNodeById(selectedSbComp[0].tagFigmaId || selectedSbComp[0].figmaId));
  }
  return selectedSbComp;
}

type ValidAstPropPrimitive = string | boolean;
interface VariantProps {
  [figmaName: string]: {
    name: string;
    valuesMap: Dict<ValidAstPropPrimitive>;
  };
}

const printComponentProps = false;

function show(node: BaseNode | null) {
  if (!node) return;
  const date = new Date().toISOString().substring(0, 19).replace('T', ' ');
  console.log(date, node.name, `figma.getNodeById('${node.id}')`, '=>', node);
  if (printComponentProps && isInstance(node) && node.mainComponent && isComponentSet(node.mainComponent?.parent)) {
    const compSet = node.mainComponent.parent;
    const propsMapped: VariantProps = {};
    for (const [propName, { values }] of Object.entries(compSet.variantGroupProperties)) {
      propsMapped[propName] = {
        name: 'TODO',
        valuesMap: values.reduce<Dict<ValidAstPropPrimitive>>((prev, current) => {
          prev[current] = 'TODO';
          return prev;
        }, {}),
      };
    }
    console.log(JSON.stringify(propsMapped, null, 2));
  }
}
