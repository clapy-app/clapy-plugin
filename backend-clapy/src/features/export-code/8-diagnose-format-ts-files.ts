import { Project } from 'ts-morph';

import { env } from '../../env-and-config/env';
import { tsFormatCodeSettings } from '../../env-and-config/ts-format-code-settings';
import { CodeDict } from './code.model';

const formatWithNativeTypescript = true;

export function diagnoseFormatTsFiles(project: Project) {
  // Global diagnostic
  if (env.isDev) {
    const globalDiag = project.getPreEmitDiagnostics();
    if (globalDiag.length) {
      console.log(project.formatDiagnosticsWithColorAndContext(globalDiag));
    }
  }

  const tsFiles: CodeDict = {};
  for (const file of project.getSourceFiles()) {
    let path = file.getFilePath() as string;
    if (path.startsWith('/')) {
      path = path.substring(1);
    }
    let content = file.getFullText();

    // File diagnostic - useful?
    // if (env.isDev) {
    //   const diagnostics = project.getLanguageService().getSuggestionDiagnostics(file);
    //   if (diagnostics.length) {
    //     console.log(project.formatDiagnosticsWithColorAndContext(diagnostics));
    //   }
    // }

    // Formatting
    if (formatWithNativeTypescript) {
      content = project.getLanguageService().getFormattedDocumentText(path, tsFormatCodeSettings);
    }

    tsFiles[path] = content;
  }
  return tsFiles;
}
