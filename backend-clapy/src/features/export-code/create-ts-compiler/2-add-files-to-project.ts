import { Project } from 'ts-morph';
import { Dict } from '../../sb-serialize-preview/sb-serialize.model';
import { tsConfigFilePath } from './1-create-compiler-project';

export async function addFilesToProject(project: Project, files: Dict<string>) {
  for (const [path, content] of Object.entries(files)) {
    if (path === tsConfigFilePath) {
      console.warn('tsconfig.json was found in project files. It was supposed to be omitted.');
      continue;
    }
    /* const file = */ project.createSourceFile(path, content /*, { overwrite: true }*/);
  }
  // It seems saving the files to the file system is not required for our use case.
  // await project.save();
}

// export function addFilesToProject0(project: Project, files: ProjectFiles) {
//   let atLeastOneChanged = false;
//   const toReload: string[] = [];

//   const projectExt = project as ProjectExt;
//   // Attaching previous files to the project allows to clear them on the same time as
//   // the project is reset, e.g. HMR, and it ensures we always init when it should be.
//   const { previousFiles } = projectExt;
//   const newFiles: ProjectFilesWithSourceFile = { ...previousFiles };

//   for (const [path, file] of Object.entries(files)) {
//     if (!file) {
//       console.warn('[addFilesToProject] Skipping undefined file for path', path);
//       continue;
//     }
//     const { content } = file;
//     // tsconfig has a special status: changes will recreate the whole project in
//     // selectEmptyProject
//     if (path === tsConfigFilePath) continue;
//     let fileFound = project.getSourceFile(path);

//     if (previousFiles?.[path]?.content !== content) {
//       if (!fileFound) {
//         // New file
//         fileFound = project.createSourceFile(path, content /*, { overwrite: true }*/);
//       } else {
//         // Update
//         fileFound.replaceWithText(content);
//       }
//       newFiles[path] = { ...file, sourceFile: fileFound };
//       toReload.push(path);

//       atLeastOneChanged = true;
//     }
//   }
//   if (previousFiles) {
//     for (const path of Object.keys(previousFiles)) {
//       if (!path) {
//         console.warn('[addFilesToProject] Skipping undefined path');
//         continue;
//       }
//       if (!newFiles[path]) {
//         project.removeSourceFile(project.getSourceFileOrThrow(path));
//         atLeastOneChanged = true;
//       }
//     }
//   }

//   projectExt.previousFiles = newFiles;

//   if (atLeastOneChanged) project.saveSync();
//   // previousFiles = files;

//   // Why 2? I have the memory of a bug if only once, and saving twice was a workaround...
//   if (atLeastOneChanged) project.saveSync();

//   // It adds duplicates when files are renamed with a timestamp. Weird behavior.
//   // project.resolveSourceFileDependencies();

//   // TO DO to implement.
//   //  We should exclude static files (HTML/CSS) from the emit and diagnostic.
//   //  We should exclude node_modules from the diagnostic.
//   //  We should have typings for .svg & co that are imported in ts. snowpack has examples, but
//   //  it should match what we actually support (implemented in custom fetch).
//   // const diag = project.getPreEmitDiagnostics();
//   // Wrap in an object to always change the reference and trigger the next steps of the chain,
//   // e.g. emit JS code.
//   return { toReload, files: newFiles };
// }
