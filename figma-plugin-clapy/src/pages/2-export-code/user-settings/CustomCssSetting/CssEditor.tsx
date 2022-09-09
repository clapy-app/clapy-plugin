import { highlight, languages } from 'prismjs';
import 'prismjs/components/prism-css';
import 'prismjs/themes/prism.css';
import type { FC } from 'react';
import { memo, useCallback, useEffect, useRef, useState } from 'react';
import Editor from 'react-simple-code-editor';

import { fetchPlugin, fetchPluginNoResponse, subscribePlugin } from '../../../../common/plugin-utils.js';
import classes from './CssEditor.module.css';

const wrapWithCssSelector = false;

interface Props {
  isLoading: boolean;
}
const cssSample = wrapCssRules(`/* E.g. \`display: block;\` */`);

export const CssEditor: FC<Props> = memo(function CssEditor(props) {
  const { isLoading } = props;
  // state vs ref: state to re-render the UI.
  // Avoid passing it as dependencies to useEffect and useCallback as much as possible. For useEffect especially, keep in mind it will be rerun each time a dependency value changes.
  // ref when you just want to keep track of the value without re-rendering the UI.
  const [code, setCode] = useState(cssSample);
  // `code` is both in a state and a ref, so that we can read its latest value within useEffect without passing it as a dependency (this useEffect should NOT be rerun).
  const codeRef = useRef(code);
  const nodeIdRef = useRef<string | undefined>();
  const setHighlight = useCallback((code: string) => highlight(code, languages.css, 'css'), []);

  const updateCode = useCallback((code: string) => {
    setCode(code);
    codeRef.current = code;
    saveCustomCssInFigmaNode(code, nodeIdRef.current);
  }, []);

  useEffect(() => {
    const dispose = subscribePlugin('selectionCustomCss', (error, customCss) => {
      // Save the previous code, in case the selection changed before the debounce has effect
      saveCustomCssInFigmaNodeImmediately(codeRef.current, nodeIdRef.current);
      codeRef.current;

      // Then replace the editor code with the new selection's code
      const { id, css } = customCss || {};
      const newSelectionCode = !css ? cssSample : wrapCssRules(css);
      setCode(newSelectionCode);
      codeRef.current = newSelectionCode;
      nodeIdRef.current = id;
    });
    fetchPluginNoResponse('getSelectionCustomCss');
    return dispose;
  }, []);

  return (
    <div className={classes.root}>
      <Editor
        disabled={isLoading}
        value={code}
        onValueChange={updateCode}
        highlight={setHighlight}
        padding={10}
        className={isLoading ? `${classes.editor} ${classes.disabled}` : classes.editor}
      />
    </div>
  );
});

function wrapCssRules(cssRules: string) {
  return !wrapWithCssSelector
    ? cssRules
    : `.element {
  ${cssRules}
}`;
}

function unwrapCssRules(cssCode: string) {
  // Comments and surrounding spaces are always removed.
  cssCode = cssCode.replace(/\/\*[^*]*\*+(?:[^\/*][^*]*\*+)*\//g, '').trim();
  // If no unwrap, we stop here.
  if (!wrapWithCssSelector) return cssCode;
  // Special case: if everything was removed in the code editor, we reset the Figma node.
  if (!cssCode) return '';
  // Here, we expect a format like .element { /* rules here */ }. We remove the selector and keep the rules.
  const matches = cssCode.match(/[^{]+\{([^}]*)}/);
  if (matches?.length !== 2) {
    // There is something, but with the wrong pattern: ignored.
    return false;
  }
  return matches[1].trim();
}

// Alternative: throttle instead of debounce. Not sure that's what we want here.
const saveCustomCssInFigmaNode = debounce(saveCustomCssInFigmaNodeImmediately, 500);

function saveCustomCssInFigmaNodeImmediately(code: string, nodeId: string | undefined) {
  const styles = unwrapCssRules(code);
  if (styles !== false) {
    fetchPlugin('saveCustomCssInFigmaNode', styles, nodeId);
  }
}

function debounce<FnType extends (...args: any[]) => void>(func: FnType, wait: number, immediate?: boolean): FnType {
  var timeout: number | undefined;

  return function executedFunction(...args: any[]) {
    var later = function () {
      timeout = undefined;
      if (!immediate) func(...args);
    };

    var callNow = immediate && !timeout;

    clearTimeout(timeout);

    timeout = setTimeout(later, wait);

    if (callNow) func(...args);
  } as FnType;
}
