import { Expression, FunctionDeclaration, JsxChild, Node, Project, SourceFile, SourceFileStructure } from 'ts-morph';
import { Dict } from '../../sb-serialize-preview/sb-serialize.model';

export type ProjectFiles = Dict<ProjectFile>;

export interface ProjectFile {
  name: string;
  path: string;
  content: string;
}

export interface FileUpdatePayload {
  path: string;
  content: string;
}

export type ProjectFilesWithSourceFile = Dict<ProjectFileWithSourceFile>;

export interface ProjectFileWithSourceFile extends ProjectFile {
  /**
   * Reference to ts-morph file. Only filled after the ts-morph project has been filled with
   * files.
   */
  sourceFile: SourceFile;
}

export type ProjectFilesWithComp = Dict<ProjectFileWithComp>;

export interface ProjectFileWithComp extends ProjectFileWithSourceFile {
  components: Dict<ProjectComponent>;
}

export interface ProjectComponent {
  name: string;
  file: SourceFile;
  path: string;
  jsx: JsxNode;
  returnedExpression: Expression;
  compDeclaration: FunctionDeclaration;
}

export interface ProjectExt extends Project {
  previousFiles: ProjectFilesWithSourceFile;
}

export interface PAppContext {
  project: Project;
  index: PFileContext;
  components: Dict<PComponent>;
  indexPath: string;
  rootPath: string;
  // TODO add files
}

export interface PFileContext {
  appContext: PAppContext;
  file: SourceFile;
  structure: SourceFileStructure;
  components: Dict<PComponent>;
  // TODO add imports
}

export enum PElementType {
  'text',
  'html',
  'component',
}

export interface PElement {
  type: PElementType;
  node: Node;
}

export interface PComponent {
  fileContext: PFileContext;
  name: string;
  elements: PElement;
  label?: string;
  declaration: Node;
}

export type CompID = number;
/**
 * JsxText | JsxExpression | JsxElement | JsxSelfClosingElement | JsxFragment
 * @alias JsxChild
 */
export type JsxNode = JsxChild;
