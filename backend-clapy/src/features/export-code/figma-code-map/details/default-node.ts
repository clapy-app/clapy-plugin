import { FrameNodeNoMethod } from '../../../sb-serialize-preview/sb-serialize.model';

// This default matches the default CSS style, i.e. it should match the CSS global resets.
export const defaultNode: FrameNodeNoMethod = {
  id: 'fake',
  type: 'FRAME',
  name: '',
  visible: true,
  opacity: 1,
  blendMode: 'PASS_THROUGH',
  isMask: false,
  effects: [],
  effectStyleId: '',
  x: 0,
  y: 0,
  width: 0,
  height: 0,
  rotation: 0,
  layoutAlign: 'INHERIT',
  layoutGrow: 0,
  fills: [],
  fillStyleId: 'fake',
  strokes: [],
  strokeStyleId: '',
  strokeWeight: 0,
  strokeAlign: 'INSIDE',
  strokeJoin: 'MITER',
  dashPattern: [],
  strokeCap: 'NONE',
  strokeMiterLimit: 4,
  cornerSmoothing: 0,
  topLeftRadius: 0,
  topRightRadius: 0,
  bottomLeftRadius: 0,
  bottomRightRadius: 0,
  paddingLeft: 0,
  paddingRight: 0,
  paddingTop: 0,
  paddingBottom: 0,
  primaryAxisAlignItems: 'MIN',
  counterAxisAlignItems: 'MIN',
  primaryAxisSizingMode: 'FIXED',
  layoutGrids: [],
  gridStyleId: '',
  clipsContent: false,
  constraints: { horizontal: 'MIN', vertical: 'MIN' },
  layoutMode: 'VERTICAL',
  counterAxisSizingMode: 'FIXED',
  itemSpacing: 0,
  overflowDirection: 'NONE',
  numberOfFixedChildren: 0,
  overlayPositionType: 'CENTER',
  overlayBackground: { type: 'NONE' },
  overlayBackgroundInteraction: 'NONE',
  reactions: [],
  children: [],
  stuckNodes: [],
};

export function makeDefaultNode(name: string, ...nodeOverrides: Partial<FrameNodeNoMethod>[]): FrameNodeNoMethod {
  return Object.assign({ ...defaultNode, name }, ...nodeOverrides);
}

export function addHugContents(): Partial<FrameNodeNoMethod> {
  return {
    primaryAxisSizingMode: 'AUTO',
    counterAxisSizingMode: 'AUTO',
    layoutGrow: 0,
    layoutAlign: 'INHERIT',
  };
}
