import TextField from '@mui/material/TextField/TextField.js';
import type { FC } from 'react';
import { memo } from 'react';
import { useSelector } from 'react-redux';
import { selectGHHasRepoSelected } from './github-slice.js';

export const codegenBranchDefaultValue = 'gencode';

interface Props {
  isLoading: boolean;
}

export const ChooseClapyBranch: FC<Props> = memo(function ChooseClapyBranch(props) {
  // const { isLoading } = props;

  const hasRepoSelected = useSelector(selectGHHasRepoSelected);
  if (!hasRepoSelected) {
    return null;
  }
  return <TextField disabled label='Clapy branch' defaultValue={codegenBranchDefaultValue} size='small' />;
});

interface GenCodeReq {
  owner: string;
  repo: string;
  codegenBranch: string;
  mergeToBranch: string;
}

interface PR {
  html_url: string;
}

// export const SendToGithub: FC<Props> = memo(function SendToGithub(props) {
//   const sendCodeToGithub = useCallbackAsync2(async () => {
//     const selectedRepo = readSelectorOnce(selectGHSelectedRepo);
//     const codegenBranch = codegenBranchDefaultValue; /* readSelectorOnce(selectGHCodegenBranch) */
//     const mergeToBranch = readSelectorOnce(selectGHSelectedTargetBranch);
//     if (!selectedRepo) throw new Error('BUG selectedRepo is undefined.');
//     if (!codegenBranch) throw new Error('BUG codegenBranch is undefined.');
//     if (!mergeToBranch) throw new Error('BUG mergeToBranch is undefined.');
//     const body: GenCodeReq = {
//       owner: selectedRepo.owner.login,
//       repo: selectedRepo.name,
//       codegenBranch,
//       mergeToBranch,
//     };
//     const { data } = await githubPost<PR>('github/gencode-tmp', body);
//     console.log('PR url:', data.html_url);
//   }, []);
//
//   const hasRepoSelected = useSelector(selectGHHasRepoSelected);
//   if (!hasRepoSelected) {
//     return null;
//   }
//
//   return (
//     <Button onClick={sendCodeToGithub} variant='outlined'>
//       Send to github
//     </Button>
//   );
// });
