import type { OutlinedInputProps } from '@mui/material';
import TextField from '@mui/material/TextField/TextField.js';
import type { FC } from 'react';
import { useRef, useCallback, useState, memo } from 'react';
import { useSelector } from 'react-redux';
import { useCallbackAsync2 } from '../../../front-utils/front-utils.js';
import { setCodeGenBranchInGHWizard } from './github-service.js';
import {
  selectGHSelectedCodegenBranch,
  selectGHHasCodegenBranchSelected,
  selectGHHasRepoSelected,
} from './github-slice.js';
import Button from '@mui/material/Button/Button.js';
import { readSelectorOnce } from '../../../core/redux/redux.utils.js';
import classes from './GithubOption.module.css';

interface Props {
  isLoading: boolean;
}

export const ChooseClapyBranch: FC<Props> = memo(function ChooseClapyBranch(props) {
  const hasRepoSelected = useSelector(selectGHHasRepoSelected);
  if (!hasRepoSelected) {
    return null;
  }
  return <ChooseClapyBranchInner {...props} />;
});

export const ChooseClapyBranchInner: FC<Props> = memo(function ChooseClapyBranchInner(props) {
  const { isLoading } = props;

  const initialValueRef = useRef(readSelectorOnce(selectGHSelectedCodegenBranch));
  const hasCodegenBranchSelected = useSelector(selectGHHasCodegenBranchSelected);
  const [_edit, setEdit] = useState(!hasCodegenBranchSelected);
  const edit = _edit || !hasCodegenBranchSelected;

  const startEdit = useCallback(() => setEdit(true), []);
  const endEdit = useCallback(() => setEdit(false), []);

  const changeCodeGenBranch = useCallbackAsync2<NonNullable<OutlinedInputProps['onChange']>>(async e => {
    await setCodeGenBranchInGHWizard(e.target.value);
  }, []);

  return (
    <div className={classes.repoSelector}>
      <TextField
        disabled={!edit || isLoading}
        className={classes.repoAutocomplete}
        label='Clapy branch'
        defaultValue={initialValueRef.current}
        onChange={changeCodeGenBranch}
        onBlur={endEdit}
        size='small'
        variant='outlined'
      />
      {!edit && (
        <Button variant='outlined' onClick={startEdit} disabled={isLoading}>
          {hasCodegenBranchSelected ? 'Change' : 'Choose'}
        </Button>
      )}
    </div>
  );
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
