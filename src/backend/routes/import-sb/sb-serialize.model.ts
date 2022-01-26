export interface CElementNode {
  name: string;
  type: typeof Node.ELEMENT_NODE;
  // styles: Dict<string>;
  styles: {
    display: string;
    flexDirection: string;
    width: string;
    height: string;
    fontSize: string;
    fontWeight: string;
    lineHeight: string;
    textAlign: string;
    color: string;
    backgroundColor: string;
    borderColor: string;
    borderStyle: string;
    borderWidth: string;
    position: string;
    left: string;
    top: string;
    right: string;
    bottom: string;
  };
  children?: CNode[];
}
export interface CTextNode {
  name: '#text';
  type: typeof Node.TEXT_NODE;
  value: string;
}
export type CNode = CElementNode | CTextNode;

const ELEMENT_NODE = 1; // Node.ELEMENT_NODE in browser
const TEXT_NODE = 3; // Node.TEXT_NODE in browser

export function isCElementNode(node: CNode): node is CElementNode {
  return node.type === ELEMENT_NODE;
}

export function isCTextNode(node: CNode): node is CTextNode {
  return node.type === TEXT_NODE;
}