import { ProjectContext } from '../../code.model';

export function genStyles(context: ProjectContext) {
  const { tokens } = context;
  if (!tokens) return;

  // console.log('Gen styles', tokens?.values);
}
