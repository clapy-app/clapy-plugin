import { Dict2 } from '../../../utils';
import {
  CElementNode,
  CNode,
  CPseudoElementNode,
  CssDefaults,
  CSSStyleDeclarationNoMethod,
  CTextNode,
  Dict,
  MyCSSVariables,
  MyStyleRules,
  MyStyles,
  MyStylesPE,
  Properties,
  Property,
  StyleKey,
} from '../sb-serialize.model';

// If need to split in separate functions and files (because it's too big), see:
// https://github.com/puppeteer/puppeteer/blob/v13.1.2/docs/api.md#pageexposefunctionname-puppeteerfunction

export async function serializePreviewPuppeteer(cssDefaults: CssDefaults) {
  // TODO add inherited properties management. Example of list of inherited properties:
  // https://www.sitepoint.com/css-inheritance-introduction/#list-css-properties-inherit

  // TODO manage variables in shorthand properties.
  // Ex list of shorthand properties: https://developer.mozilla.org/fr/docs/Web/CSS/Shorthand_properties
  // As of now, if we have `background: var(--col) repeat-x`, then
  // getPropertyValue('background-color') returns ''
  // getPropertyValue('background-repeat') returns ''
  // background does not appear in the list of rules (from `Array.from(style)`).
  // We can work around it by evaluating the variables in `background` first. Example if --col is "blue":
  // let background = getPropertyValue('background'); // => 'var(--col) repeat-x'
  // background = background.replaceAll(... /* replace variables */); // => 'blue repeat-x'
  // setProperty('background', background);
  // Then iterate over `Array.from(style)`:
  // getPropertyValue('background-color') returns 'blue'
  // getPropertyValue('background-repeat') returns 'repeat-x'

  const getMatchedCSSRules = getMatchedCSSRulesFactory();

  const root = document.getElementById('root');
  if (!root) {
    throw new Error(`The storybook page has no node with selector #root.`);
  }

  // Cache for below functions
  const { cssStyleRules, fontFaces } = listCSSStyleRules();

  const allCSSVariableNames = getAllCSSVariableNames();
  const rootCSSVariables = getElementCSSVariables(allCSSVariableNames, root);
  const iconFontFamilies = new Set<string>();

  const nodes = toCNodes(root.childNodes, rootCSSVariables, iconFontFamilies);

  // Filter to return the list of font faces used for icons only.
  // We will use it to generate SVGs for icons and import them in Figma.
  const filteredFontFaces = fontFaces.filter(
    ({ fontFamily }) => fontFamily && iconFontFamilies.has(unquoteAndTrimString(fontFamily)),
  );

  return { nodes, fontFaces: filteredFontFaces };

  // Functions in browser context

  function toCNodes(
    childNodes: NodeListOf<ChildNode> | undefined,
    parentCSSVariables: Dict<string>,
    iconFontFamilies: Set<string>,
  ): CNode[] {
    if (!childNodes) return [];
    const nodes: CNode[] = [];
    for (const browserNode of Array.from(childNodes)) {
      const name = browserNode.nodeName.toLowerCase();

      if (isElement(browserNode)) {
        // Prepare the element computed styles
        const computedStyles = window.getComputedStyle(browserNode) as Properties;
        const styles: MyStyles = pickExcludeDefaults(computedStyles, cssDefaults);

        // Then prepare the style rules from CSS.
        const { matchedRules, matchedBeforeRules, matchedAfterRules } = getMatchedCSSRules(browserNode);
        const { styleRules, cssVariables } = mergeStyleRules(matchedRules, browserNode);
        // Use the variables available for the element to have the real value.
        const mergedCSSVariables = { ...parentCSSVariables, ...cssVariables };
        // Replace variable usages with the corresponding values:
        const matchVarRegex = new RegExp(`var\\((${Object.keys(mergedCSSVariables).join('|')})\\)`, 'gi');
        const varReplacer = (_: string, group1: string) => mergedCSSVariables[group1];
        replaceCSSVariables(styleRules, matchVarRegex, varReplacer);

        const children = toCNodes(
          name !== 'svg' ? browserNode.childNodes : undefined,
          mergedCSSVariables,
          iconFontFamilies,
        );

        // Pseudo elements :before and :after
        for (const { namePE, matchedRules } of [
          { namePE: ':before', matchedRules: matchedBeforeRules },
          { namePE: ':after', matchedRules: matchedAfterRules },
        ] as const) {
          const { styleRules } = mergeStyleRules(matchedRules);
          replaceCSSVariables(styleRules, matchVarRegex, varReplacer);

          const computedStyle = window.getComputedStyle(browserNode, namePE) as Properties;
          if (computedStyle.content !== 'none') {
            const styles: MyStylesPE = {
              content: unquoteAndTrimString(computedStyle.content) as Property.Content,
              ...pickExcludeDefaults(computedStyle, cssDefaults),
            };
            let isFontIcon = false;
            if (checkIsFontIcon(styles.content)) {
              iconFontFamilies.add(unquoteAndTrimString(styles.fontFamily));
              isFontIcon = true;
            }

            const node: CPseudoElementNode = {
              name: `${name}${namePE}`,
              type: -1,
              styles,
              styleRules,
              isFullWidth: false,
              isFullHeight: false,
              isFontIcon,
              svg: undefined as any, // Will be defined outside puppeteer
            };
            if (namePE === ':before') {
              children.unshift(node);
            } else {
              children.push(node);
            }
          }
        }

        if (browserNode.nodeType !== 1) {
          console.warn('Element with node type which is not 1:', browserNode.nodeName, '- type:', browserNode.nodeType);
        }
        const node: CElementNode = {
          name,
          type: browserNode.nodeType as 1,
          styles,
          styleRules,
          isFullWidth: false,
          isFullHeight: false,
          className: browserNode.className,
          src: (browserNode as HTMLImageElement).src,
          children,
          svg: name === 'svg' ? browserNode.outerHTML : undefined,
        };
        nodes.push(node);
      } else if (isText(browserNode)) {
        if (name !== '#text') {
          console.warn('Text node has a nodeName different from `#text`:', name);
        }
        if (browserNode.nodeType !== 3) {
          console.warn(
            'Text node with node type which is not 3 - type:',
            browserNode.nodeType,
            '- text:',
            browserNode.nodeValue,
          );
        }
        const node: CTextNode = {
          name: '#text',
          type: browserNode.nodeType as 3,
          value: browserNode.nodeValue,
        };
        nodes.push(node);
      }
      // Node.COMMENT_NODE
    }
    return nodes;
  }

  function isElement(node: Node): node is HTMLElement {
    return node.nodeType === Node.ELEMENT_NODE;
  }

  function isText(node: Node): node is Text {
    return node.nodeType === Node.TEXT_NODE;
  }

  function pickExcludeDefaults(computedStyles: Properties, cssDefaults: CssDefaults): MyStyles {
    return entries(cssDefaults).reduce((previous, [cssKey, defaultValue]) => {
      const value: any = computedStyles[cssKey];
      if (value !== defaultValue) {
        // Cast to any to avoid a TS error:
        // "Expression produces a union type that is too complex to represent."
        // I don't really understand why we get it here and how we could avoid it.
        // Ref: https://github.com/microsoft/TypeScript/issues/33130
        // Does NOT work: previous[cssKey as keyof typeof previous] = ...
        // Does NOT work: previous[cssKey as string] = ...
        // @ts-ignore
        previous[cssKey] = value;
      }
      return previous;
    }, {} as MyStyles);
  }

  function mergeStyleRules(styleRules: CSSStyleRule[], node?: HTMLElement) {
    const mergedStyleRules: MyStyleRules = {};
    const mergedCSSVariables: MyCSSVariables = {};
    const mergedRuleImportant = {} as Dict2<StyleKey, boolean>;
    const rules = node ? [{ style: node.style }, ...styleRules] : styleRules;
    for (const { style } of rules) {
      for (const { isCSSVariable, ruleNameDashCase, ruleName } of ruleNamesFromStyle(style)) {
        const merged = isCSSVariable ? mergedCSSVariables : mergedStyleRules;
        const isImportant = style.getPropertyPriority(ruleNameDashCase) === 'important';
        if (
          // To override, the previous rule must NOT be !important regardless of the new rule.
          mergedRuleImportant[ruleName] == null &&
          (isImportant || merged[ruleName] == null)
        ) {
          const styleValue = trim(style.getPropertyValue(ruleNameDashCase));
          merged[ruleName] = styleValue;
          if (isImportant) {
            mergedRuleImportant[ruleName] = true;
          }
        }
      }
    }
    return { styleRules: mergedStyleRules, cssVariables: mergedCSSVariables };
  }

  function trim<T>(value: T): T {
    return typeof value === 'string' ? (value.trim() as unknown as T) : value;
  }

  function ruleNamesFromStyle(style: CSSStyleDeclaration) {
    return Array.from(style).map(ruleNameDashCase => {
      const isCSSVariable = ruleNameDashCase.startsWith('--');
      return {
        isCSSVariable,
        ruleNameDashCase,
        ruleName: ruleNameToCamelCase(ruleNameDashCase, isCSSVariable),
      };
    });
  }

  // border-radius => borderRadius
  // -moz-border-radius => MozBorderRadius
  function ruleNameToCamelCase(ruleNameDashCase: string, isCSSVariable: boolean): StyleKey {
    if (isCSSVariable) {
      // CSS variable name
      return ruleNameDashCase as keyof Properties;
    }
    return ruleNameDashCase.replace(
      /-([a-z])/gi,
      (_, g1 /* , shift */) => g1.toUpperCase(),
      // If we don't want to uppercase the first letter for browser prefix (e.g. for -ms-*):
      // shift === 0 ? g1 : `${g1.toUpperCase()}`
    ) as keyof Properties;
  }

  function replaceCSSVariables(
    styleRules: Properties,
    matchVarRegex: RegExp,
    varReplacer: (_: string, group1: string) => string,
  ) {
    for (const [ruleName, value] of entries(styleRules)) {
      if (typeof value === 'string') {
        // @ts-ignore
        styleRules[ruleName] = value.replace(matchVarRegex, varReplacer);
      } else {
        console.warn('CSS rule value is not a string:', ruleName, ':', value);
      }
    }
  }

  // Inspiration: https://stackoverflow.com/a/54470889/4053349
  function getAllCSSVariableNames() {
    // Step 1: list all variables in the app, regardless of which elements it applies to.
    // It is useful to get variables applied on parent nodes which are not :root.
    const allCSSVariableNames: string[] = [];
    for (const { style } of cssStyleRules) {
      for (const name of Array.from(style)) {
        if (name.startsWith('--') && !allCSSVariableNames.includes(name)) {
          allCSSVariableNames.push(name);
        }
      }
    }
    return allCSSVariableNames;
  }

  // Step 2: evaluates all variables on a given element to check their values on it.
  function getElementCSSVariables(allCSSVariableNames: string[], element: Element) {
    const elStyles = window.getComputedStyle(element);
    const cssVars: /* Properties */ Dict<string> = {};
    for (let i = 0; i < allCSSVariableNames.length; i++) {
      const key = allCSSVariableNames[i];
      const value = trim(elStyles.getPropertyValue(key));
      if (value) {
        cssVars[key] = value;
      }
    }
    return cssVars;
  }

  // TODO support pseudo-elements

  // https://stackoverflow.com/a/37958301/4053349
  // polyfill window.getMatchedCSSRules()
  function getMatchedCSSRulesFactory() {
    const ELEMENT_RE = /[\w-]+/g,
      ID_RE = /#[\w-]+/g,
      CLASS_RE = /\.[\w-]+/g,
      ATTR_RE = /\[[^\]]+\]/g,
      // :not() pseudo-class does not add to specificity, but its content does as if it was outside it
      PSEUDO_CLASSES_RE = /\:(?!not)[\w-]+(\(.*\))?/g,
      PSEUDO_ELEMENTS_RE = /\:\:?(after|before|first-letter|first-line|selection)/g,
      PSEUDO_ELEMENTS_RE2 = /(.*?)::?(before|after)$/,
      BEFORE_SELECTOR_RE = /(.*?)::?before$/,
      AFTER_SELECTOR_RE = /(.*?)::?after$/;

    //TODO: not supporting 2nd argument for selecting pseudo elements
    //TODO: not supporting 3rd argument for checking author style sheets only
    return function getMatchedCSSRules(element: HTMLElement /*, pseudo, author_only*/) {
      const matchedRules: CSSStyleRule[] = [];
      const matchedBeforeRules: CSSStyleRule[] = [];
      const matchedAfterRules: CSSStyleRule[] = [];
      // Keep rules which selector match this element
      for (const rule of cssStyleRules) {
        const { matchesElement, matchesBefore, matchesAfter } = selectorMatchesElementAndPseudo(
          element,
          rule.selectorText,
        );
        if (matchesElement) {
          matchedRules.push(rule);
        }
        if (matchesBefore) {
          matchedBeforeRules.push(rule);
        }
        if (matchesAfter) {
          matchedAfterRules.push(rule);
        }
      }
      // Sort according to specificity
      return {
        matchedRules: sortBySpecificity(element, matchedRules),
        matchedBeforeRules: sortBySpecificity(element, matchedBeforeRules, 'before'),
        matchedAfterRules: sortBySpecificity(element, matchedAfterRules, 'after'),
      };
    };

    // Returns the list of what it matches among element, :before and :after.
    function selectorMatchesElementAndPseudo(el: Element, selector: string) {
      let matchesElement = false,
        matchesBefore = false,
        matchesAfter = false;
      if (el.matches(selector)) {
        matchesElement = true;
      }
      for (const sel of selector.split(',')) {
        const matches = sel.trim().match(PSEUDO_ELEMENTS_RE2);
        if (matches) {
          const elementSelector = matches[1];
          const pseudoElementName = matches[2];
          if (!elementSelector || el.matches(elementSelector)) {
            if (pseudoElementName === 'before') {
              matchesBefore = true;
            } else if (pseudoElementName === 'after') {
              matchesAfter = true;
            } else {
              throw new Error(`Unexpected: matches pseudo element selector, but it's neither before nor after.`);
            }
          }
        }
      }
      return { matchesElement, matchesBefore, matchesAfter };
    }

    function selectorMatchesElementOrPseudo(el: Element, selector: string, pseudoElementName?: string): boolean {
      if (!pseudoElementName) {
        return el.matches(selector);
      }
      for (const sel of selector.split(',')) {
        const matches = sel.trim().match(pseudoElementName === 'before' ? BEFORE_SELECTOR_RE : AFTER_SELECTOR_RE);
        if (matches) {
          const elementSelector = matches[1];
          if (!elementSelector || el.matches(elementSelector)) {
            return true;
          }
        }
      }
      return false;
    }

    function sortBySpecificity(element: Element, rules: CSSStyleRule[], pseudoElementName?: string) {
      // comparing function that sorts CSSStyleRules according to specificity of their `selectorText`
      function compareSpecificity(a: CSSStyleRule, b: CSSStyleRule) {
        return (
          getSpecificityScore(element, b.selectorText, pseudoElementName) -
          getSpecificityScore(element, a.selectorText, pseudoElementName)
        );
      }

      return rules.sort(compareSpecificity);
    }

    // returns the heights possible specificity score an element can get from a give rule's selectorText
    function getSpecificityScore(element: Element, selector_text: string, pseudoElementName?: string) {
      const selectors = selector_text.split(',');
      let selector: string | undefined;
      let score: number;
      let result: number | undefined;
      while ((selector = selectors.shift())) {
        if (selectorMatchesElementOrPseudo(element, selector, pseudoElementName)) {
          score = calculateScore(selector);
          result = result == null || score > result ? score : result;
        }
      }
      // At least one should match because it has been previously filtered with matchesSelector on the whole selector.
      return result ?? -1;
    }

    // calculates the specificity of a given `selector`
    function calculateScore(selector: string) {
      const score = [0, 0, 0];
      const parts = selector.split(' ');
      let part: string | undefined, match: number;
      //TODO: clean the ':not' part since the last ELEMENT_RE will pick it up
      while (((part = parts.shift()), typeof part == 'string')) {
        // find all pseudo-elements
        match = _find(part, PSEUDO_ELEMENTS_RE);
        score[2] += match;
        // and remove them
        match && (part = part.replace(PSEUDO_ELEMENTS_RE, ''));

        // find all pseudo-classes
        match = _find(part, PSEUDO_CLASSES_RE);
        score[1] += match;
        // and remove them
        match && (part = part.replace(PSEUDO_CLASSES_RE, ''));

        // find all attributes
        match = _find(part, ATTR_RE);
        score[1] += match;
        // and remove them
        match && (part = part.replace(ATTR_RE, ''));

        // find all IDs
        match = _find(part, ID_RE);
        score[0] += match;
        // and remove them
        match && (part = part.replace(ID_RE, ''));

        // find all classes
        match = _find(part, CLASS_RE);
        score[1] += match;
        // and remove them
        match && (part = part.replace(CLASS_RE, ''));

        // find all elements
        score[2] += _find(part, ELEMENT_RE);
      }
      return parseInt(score.join(''), 10);
    }

    function _find(string: string, re: RegExp) {
      const matches = string.match(re);
      return matches ? matches.length : 0;
    }
  }

  function listCSSStyleRules() {
    const styleSheets = Array.from(window.document.styleSheets);
    let sheet: CSSStyleSheet | undefined; /* sheet_media, */
    let rules: CSSRule[];
    let rule: CSSRule | undefined;
    const cssStyleRules: CSSStyleRule[] = [];
    const fontFaces: CSSStyleDeclarationNoMethod[] = [];
    // get stylesheets and convert to a regular Array

    // assuming the browser hands us stylesheets in order of appearance
    // we iterate them from the beginning to follow proper cascade order
    while ((sheet = styleSheets.pop())) {
      // get the style rules of this sheet
      rules = getSheetRules(sheet);
      // loop the rules in order of appearance
      while ((rule = rules.pop())) {
        // if this is an @import rule
        if (isCSSImportRule(rule)) {
          // insert the imported stylesheet's rules at the beginning of this stylesheet's rules
          rules = rules.concat(getSheetRules(rule.styleSheet));
          // and skip this rule
          continue;
        }
        // if there's no stylesheet attribute BUT there IS a media attribute it's a media rule
        else if (isCSSMediaRule(rule)) {
          // insert the contained rules of this media rule to the beginning of this stylesheet's rules
          rules = rules.concat(getSheetRules(rule));
          // and skip it
          continue;
        } else if (
          isCSSPageRule(rule) ||
          isCSSKeyframesRule(rule) ||
          isCSSFontFaceRule(rule) ||
          isCSSSupportsRule(rule)
        ) {
          if (isCSSFontFaceRule(rule)) {
            const fontFace: CSSStyleDeclarationNoMethod = {};
            for (const { ruleNameDashCase, ruleName } of ruleNamesFromStyle(rule.style)) {
              // @ts-ignore
              fontFace[ruleName] = rule.style.getPropertyValue(ruleNameDashCase);
            }
            fontFaces.push(fontFace);
          }
          // Ignore
          continue;
        } else if (!isCSSStyleRule(rule)) {
          console.warn('Unsupported CSSRule, ignored:', rule.cssText);
          continue;
        }

        cssStyleRules.push(rule);
      }
    }
    return { cssStyleRules, fontFaces };
  }

  // handles extraction of `cssRules` as an `Array` from a stylesheet or something that behaves the same
  function getSheetRules(stylesheet: CSSStyleSheet | CSSMediaRule) {
    const sheetMedia = stylesheet.media && stylesheet.media.mediaText;
    // if this sheet is disabled skip it
    if ((stylesheet as CSSStyleSheet).disabled) return [];
    // if this sheet's media is specified and doesn't match the viewport then skip it
    if (sheetMedia && sheetMedia.length && !window.matchMedia(sheetMedia).matches) return [];
    // get the style rules of this sheet
    try {
      return Array.from(stylesheet.cssRules);
    } catch (error: any) {
      if (error?.message === "Failed to read the 'cssRules' property from 'CSSStyleSheet': Cannot access rules") {
        console.warn('Cannot load CSS rules because of CORS from URL:', (stylesheet as CSSStyleSheet).href);
        return [];
      }
      throw error;
    }
  }

  function isCSSStyleRule(cssRule: CSSRule): cssRule is CSSStyleRule {
    return !!(cssRule as CSSStyleRule).selectorText && !isCSSGroupingRule(cssRule);
  }

  function isCSSImportRule(cssRule: CSSRule): cssRule is CSSImportRule {
    return !!(cssRule as CSSImportRule).styleSheet;
  }

  function isCSSMediaRule(cssRule: CSSRule): cssRule is CSSMediaRule {
    return !!(cssRule as CSSMediaRule).media;
  }

  function isCSSPageRule(cssRule: CSSRule): cssRule is CSSPageRule {
    return !!(cssRule as CSSPageRule).selectorText && isCSSGroupingRule(cssRule);
  }

  function isCSSGroupingRule(cssRule: CSSRule): cssRule is CSSGroupingRule {
    return !!(cssRule as CSSGroupingRule).cssRules && !(cssRule as CSSKeyframesRule).name;
  }

  function isCSSKeyframesRule(cssRule: CSSRule): cssRule is CSSKeyframesRule {
    return !!(cssRule as CSSKeyframesRule).cssRules && !!(cssRule as CSSKeyframesRule).name;
  }

  // function isCSSKeyframeRule(cssRule: CSSRule): cssRule is CSSKeyframeRule {
  //   return !!(cssRule as CSSKeyframeRule).keyText;
  // }

  function isCSSFontFaceRule(cssRule: CSSRule): cssRule is CSSFontFaceRule {
    return !!(cssRule as CSSFontFaceRule).style && !(cssRule as CSSStyleRule).selectorText;
  }

  function isCSSSupportsRule(cssRule: CSSRule): cssRule is CSSSupportsRule {
    return !!(cssRule as CSSSupportsRule).conditionText;
  }

  type Entry<T> = { [K in keyof T]: [K, T[K]] }[keyof T] & Iterable<any>;
  function entries<T>(o: T): Entry<T>[] {
    return Object.entries(o) as unknown as Entry<T>[];
  }

  // Unicode check functions
  function checkIsFontIcon(content: string): boolean {
    if (isUnicode(content)) {
      const charCode = getCharCodeFromUnicodeChar(content);
      return isUnicodeInPrivateUseAreas(charCode);
    }
    return false;
  }
  function unquoteAndTrimString<T extends string | undefined>(str: T): T {
    return str ? (str.replace(/^\s*"\s*(.*)\s*"\s*$/, '$1') as T) : str;
  }
  function isUnicode(str: string): boolean {
    return str.length === 1 || str.length === 2;
  }
  function getCharCodeFromUnicodeChar(unicode: string) {
    if (unicode.length === 1) {
      return unicode.charCodeAt(0);
    } else if (unicode.length === 2) {
      // src: https://stackoverflow.com/a/37729608/4053349
      return (unicode.charCodeAt(0) - 0xd800) * 0x400 + (unicode.charCodeAt(1) - 0xdc00) + 0x10000;
    }
    throw new Error(`Unsupported unicode character, can't return the hexa code: \`${unicode}\``);
  }
  function isUnicodeInPrivateUseAreas(charCode: number) {
    // https://en.wikipedia.org/wiki/Private_Use_Areas
    return (
      (charCode >= 0xe000 && charCode <= 0xf8ff) ||
      (charCode >= 0xf0000 && charCode <= 0xffffd) ||
      (charCode >= 0x100000 && charCode <= 0x10fffd)
    );
  }
}

// TODO for better CSS rules analysis, check the CSSUtilities lib:
// http://www.brothercake.com/site/resources/scripts/cssutilities/
// It has a demo providing an inspection like Chrome dev tools with inherited rules.
// (but seems KO for pseudo-elements.)
