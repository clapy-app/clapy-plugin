import Button from '@mui/material/Button';
import type { FC } from 'react';
import { useRef, useCallback, memo, useState } from 'react';
import { useSelector } from 'react-redux';
import classes from './GithubOption.module.css';
import Autocomplete from '@mui/material/Autocomplete/Autocomplete.js';
import { useCallbackAsync2 } from '../../../front-utils/front-utils.js';
import {
  selectGHBranchesOrJustSelection,
  selectGHHasRepoSelected,
  selectGHHasTargetBranchSelected,
  selectGHLoadingBranches,
  selectGHSelectedTargetBranch,
} from './github-slice.js';
import TextField from '@mui/material/TextField/TextField.js';
import { selectBranchInGHWizard, useLoadGHBranchesIfEditable } from './github-service.js';
import CircularProgress from '@mui/material/CircularProgress/CircularProgress.js';

interface Props {}

export const ChooseBranchAutocomplete: FC<Props> = memo(function ChooseBranchAutocomplete(props) {
  const hasRepoSelected = useSelector(selectGHHasRepoSelected);
  if (!hasRepoSelected) {
    return null;
  }
  return <ChooseBranchAutocompleteInner />;
});

const ChooseBranchAutocompleteInner: FC<Props> = memo(function ChooseBranchAutocompleteInner(props) {
  const branches = useSelector(selectGHBranchesOrJustSelection);
  const hasTargetBranchSelected = useSelector(selectGHHasTargetBranchSelected);
  const selectedTargetBranch = useSelector(selectGHSelectedTargetBranch);
  const autocompleteValueRef = useRef(selectedTargetBranch);
  const [edit, setEdit] = useState(!hasTargetBranchSelected);

  const startEdit = useCallbackAsync2(() => {
    setEdit(true);
  }, []);
  const endEdit = useCallback(() => setEdit(false), []);
  const selectBranch = useCallbackAsync2(async (_, branch: string | null) => {
    selectBranchInGHWizard(branch);
  }, []);

  useLoadGHBranchesIfEditable(edit);

  const showEdit = edit || !hasTargetBranchSelected;

  const loadingBranches = useSelector(selectGHLoadingBranches);

  return (
    <>
      <div className={classes.repoSelector}>
        <Autocomplete<string>
          defaultValue={autocompleteValueRef.current}
          loading={loadingBranches}
          size='small'
          className={classes.repoAutocomplete}
          options={branches /* && !loadingBranches */ ? branches : []}
          getOptionLabel={branch => branch}
          renderInput={params => (
            <TextField
              {...params}
              label='Branch'
              InputProps={{
                ...params.InputProps,
                endAdornment: (
                  <>
                    {loadingBranches ? <CircularProgress color='inherit' size={20} /> : null}
                    {params.InputProps.endAdornment}
                  </>
                ),
              }}
            />
          )}
          onChange={selectBranch}
          onClose={endEdit}
          disabled={!showEdit}
          blurOnSelect
          selectOnFocus
          clearOnBlur
          handleHomeEndKeys
        />
        {!showEdit && (
          <Button variant='outlined' onClick={startEdit}>
            {hasTargetBranchSelected ? 'Change' : 'Choose'}
          </Button>
        )}
      </div>
    </>
  );
});
