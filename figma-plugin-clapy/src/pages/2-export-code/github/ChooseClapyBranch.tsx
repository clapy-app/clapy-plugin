import { Button } from '@mui/material';
import TextField from '@mui/material/TextField/TextField.js';
import type { FC } from 'react';
import { memo } from 'react';
import { useSelector } from 'react-redux';
import { readSelectorOnce } from '../../../core/redux/redux.utils.js';
import { useCallbackAsync2 } from '../../../front-utils/front-utils.js';
import { githubPost } from '../../../front-utils/http-github-utils.js';
import { selectGHHasRepoSelected, selectGHSelectedRepo, selectGHSelectedTargetBranch } from './github-slice.js';

const codegenBranchDefaultValue = 'gencode';

interface Props {}

export const ChooseClapyBranch: FC<Props> = memo(function ChooseClapyBranch(props) {
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

export const SendToGithub: FC<Props> = memo(function SendToGithub(props) {
  const sendCodeToGithub = useCallbackAsync2(async () => {
    const selectedRepo = readSelectorOnce(selectGHSelectedRepo);
    const codegenBranch = codegenBranchDefaultValue; /* readSelectorOnce(selectGHCodegenBranch) */
    const mergeToBranch = readSelectorOnce(selectGHSelectedTargetBranch);
    if (!selectedRepo) throw new Error('BUG selectedRepo is undefined.');
    if (!codegenBranch) throw new Error('BUG codegenBranch is undefined.');
    if (!mergeToBranch) throw new Error('BUG mergeToBranch is undefined.');
    const body: GenCodeReq = {
      owner: selectedRepo.owner.login,
      repo: selectedRepo.name,
      codegenBranch,
      mergeToBranch,
    };
    const res = await githubPost<any>('github/gencode-tmp', body);
    console.log('codegen res:', res);
  }, []);

  const hasRepoSelected = useSelector(selectGHHasRepoSelected);
  if (!hasRepoSelected) {
    return null;
  }

  return (
    <Button onClick={sendCodeToGithub} variant='outlined'>
      Send to github
    </Button>
  );
});
