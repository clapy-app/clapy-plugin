import { serialize } from 'parse5';
import type { Attribute } from 'parse5/dist/common/token';
import type { ChildNode, Element, Node, TextNode } from 'parse5/dist/tree-adapters/default';

// Documentation: https://parse5.js.org/modules/parse5.html
// Online playground (AST explorer): http://astexplorer.net/#/1CHlCXc4n4

// KO: import { NS } from 'parse5/dist/common/html';
enum NS {
  HTML = 'http://www.w3.org/1999/xhtml',
  MATHML = 'http://www.w3.org/1998/Math/MathML',
  SVG = 'http://www.w3.org/2000/svg',
  XLINK = 'http://www.w3.org/1999/xlink',
  XML = 'http://www.w3.org/XML/1998/namespace',
  XMLNS = 'http://www.w3.org/2000/xmlns/',
}

enum NodeType {
  Document = '#document',
  DocumentFragment = '#document-fragment',
  Comment = '#comment',
  Text = '#text',
  DocumentType = '#documentType',
}

export function mkHtmlElement(
  tagName: string,
  attributes: Attribute | Attribute[] = [],
  children: ChildNode | ChildNode[] = [],
) {
  if (!Array.isArray(attributes)) attributes = [attributes];
  if (!Array.isArray(children)) children = [children];
  const el: Element = {
    nodeName: tagName,
    tagName,
    attrs: attributes,
    namespaceURI: NS.HTML,
    parentNode: null,
    childNodes: children,
  };
  return el;
}

export function mkHtmlText(text: string) {
  const nodes: (Element | TextNode)[] = [];
  let first = true;
  for (const textFragment of text.split('<br />')) {
    if (first) {
      first = false;
    } else {
      nodes.push(mkHtmlElement('br'));
    }
    nodes.push(mkHtmlTextEscaped(textFragment));
  }
  return nodes;
}

function mkHtmlTextEscaped(text: string) {
  const el: TextNode = {
    nodeName: NodeType.Text,
    parentNode: null,
    value: text,
  };
  return el;
}

export function mkHtmlAttribute(name: string, value: string) {
  return { name, value } as Attribute;
}

export function serializeHtml(node: Node | Node[]) {
  if (!Array.isArray(node)) node = [node];
  return serialize(mkHtmlElement('div', undefined, node as ChildNode[]));
}

// # Example 1:
// const document = parse('<!DOCTYPE html><html><head></head><body><div></div><p></p></body></html>');
// console.log(serialize(document));
// const tag = ((document.childNodes[1] as Element).childNodes[1] as Element).childNodes[1];
// console.log(serializeHtml(tag));
// # Example 2:
// console.log(serializeHtml(mkHtmlElement('div', mkHtmlAttribute('class', 'bar'))));
