import { exportTemplatesDir } from '../../../root';
import { Dict } from '../../sb-serialize-preview/sb-serialize.model';
import type { ProjectComponent, ProjectFile, ProjectFilesWithComp } from './file.model';

export const reactTemplateDir = `${exportTemplatesDir}/react-project`;

export const componentTemplatePathTsx = `${exportTemplatesDir}/react-comp/CompTemplate.tsx`;
export const componentTemplatePathCss = `${exportTemplatesDir}/react-comp/CompTemplate.module.css`;

export const reactRootInMemory = '';

export enum TreeNodeKind {
  Dir,
  File,
  Comp,
}

export interface DirNode {
  kind: TreeNodeKind.Dir;
  name: string;
  path: string;
  children: Array<DirNode | FileNode>;
}

export interface FileNode {
  kind: TreeNodeKind.File;
  file: ProjectFile;
  children?: CompNode[];
}

export interface CompNode {
  kind: TreeNodeKind.Comp;
  file: ProjectFile;
  component: ProjectComponent;
  path: string;
}

export type TreeNode = DirNode | FileNode | CompNode;

type LevelTree = { result: TreeNode[] } & Dict<LevelTree>;

export function filesToTree(files: ProjectFilesWithComp, excludes: string[] = []) {
  const result: TreeNode[] = [];
  const level = { result } as LevelTree;
  const _excludes = new Set(excludes);

  for (const [path, file] of Object.entries(files)) {
    if (!file) {
      console.warn('[filesToTree] Skipping undefined file for path', path);
      continue;
    }
    const split = path.split('/').filter(p => p);
    if (splitHasExcludedFragment(split, _excludes)) continue;
    const lastIndex = split.length - 1;
    split.reduce((lvl, name, i) => {
      if (!lvl[name]) {
        lvl[name] = { result: [] as TreeNode[] } as LevelTree;
        let child: TreeNode;
        if (i === lastIndex) {
          const children = file.components
            ? Object.values(file.components).map(c =>
                !c
                  ? undefined
                  : ({
                      kind: TreeNodeKind.Comp,
                      file,
                      component: c,
                      path: c.path,
                    } as CompNode),
              )
            : undefined;
          child = {
            file,
            kind: TreeNodeKind.File,
            children,
          } as FileNode;
        } else {
          child = {
            name,
            path: `/${split.slice(0, i + 1).join('/')}`,
            children: lvl[name]!.result,
            kind: TreeNodeKind.Dir,
          } as DirNode;
        }
        lvl.result.push(child);
      }

      return lvl[name]!;
    }, level);
  }

  return result;
}

export function isDir(node: TreeNode): node is DirNode {
  return node.kind === TreeNodeKind.Dir;
}

export function isFile(node: TreeNode): node is FileNode {
  return node.kind === TreeNodeKind.File;
}

export function isComp(node: TreeNode): node is CompNode {
  return node.kind === TreeNodeKind.Comp;
}

export function nameFromPath(path: string): string {
  const lastSlash = path.lastIndexOf('/');
  if (lastSlash === -1) return path;
  return path.substr(lastSlash === -1 ? 0 : lastSlash + 1);
}

export function dirname(path: string): string {
  const lastSlash = path.lastIndexOf('/');
  if (lastSlash === -1) return path;
  return path.substr(0, lastSlash + 1);
}

export function resolveAbsolute(base: string, relative: string): string {
  const stack = base.split('/');
  const parts = relative.split('/');
  stack.pop(); // remove current file name (or empty string)
  // (omit if "base" is the current folder without trailing slash)
  for (const part of parts) {
    if (part === '.') {
      continue;
    }
    if (part === '..') {
      stack.pop();
    } else {
      stack.push(part);
    }
  }
  return stack.join('/');
}

export function splitPathIntoDirAndFileName(path: string): [string, string] {
  return splitStrIn2(path, '/');
}

export function splitFileNameIntoBaseAndExtension(fileName: string): [string, string] {
  return splitStrIn2(fileName, '.', true);
}

export function splitStrIn2(str: string, separator: string, sepInRightFragment?: boolean): [string, string] {
  const lastSep = str.lastIndexOf(separator);
  const shift = sepInRightFragment ? 0 : 1;
  if (lastSep === -1) return [str, ''];
  return [str.substr(0, lastSep + shift), str.substr(lastSep + shift)];
}

function splitHasExcludedFragment(split: string[], excludes: Set<string>) {
  for (const fragment of split) {
    if (excludes.has(fragment)) return true;
  }
  return false;
}

// export const TS_SEP = '__t__';
export const TS_SEP = '?mtime=';

// export function removeTimestampFromBaseFileName(baseFileName: string): string {
//   const i = baseFileName.lastIndexOf(TS_SEP);
//   return i === -1 ? baseFileName : baseFileName.substr(0, i);
// }
//
// export function getPathWithoutTimestamp(file: SourceFile): string {
//   return `${file.getDirectoryPath()}/${removeTimestampFromBaseFileName(
//     file.getBaseNameWithoutExtension())}${file.getExtension()}`;
// }

export function makeProjectFile(path: string, content: string): ProjectFile {
  return {
    name: nameFromPath(path),
    path,
    content,
  };
}
