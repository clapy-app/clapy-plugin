import type { FC } from 'react';
import { useCallback, memo, useState } from 'react';
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
import { setTargetBranchInGHWizard, useLoadGHBranchesIfEditable } from './github-service.js';
import CircularProgress from '@mui/material/CircularProgress/CircularProgress.js';
import Button from '@mui/material/Button/Button.js';
import Tooltip from '@mui/material/Tooltip/Tooltip.js';
import { appConfig } from '../../../common/app-config.js';

interface Props {
  isLoading: boolean;
}

export const ChooseBranchAutocomplete: FC<Props> = memo(function ChooseBranchAutocomplete(props) {
  const hasRepoSelected = useSelector(selectGHHasRepoSelected);
  if (!hasRepoSelected) {
    return null;
  }
  return <ChooseBranchAutocompleteInner {...props} />;
});

const ChooseBranchAutocompleteInner: FC<Props> = memo(function ChooseBranchAutocompleteInner(props) {
  const { isLoading } = props;

  const branches = useSelector(selectGHBranchesOrJustSelection);
  const hasTargetBranchSelected = useSelector(selectGHHasTargetBranchSelected);
  const selectedTargetBranch = useSelector(selectGHSelectedTargetBranch);
  const [_edit, setEdit] = useState(!hasTargetBranchSelected);
  const edit = _edit || !hasTargetBranchSelected;

  const startEdit = useCallback(() => setEdit(true), []);
  const endEdit = useCallback(() => setEdit(false), []);
  const setBranch = useCallbackAsync2(async (_, branch: string | null) => {
    await setTargetBranchInGHWizard(branch);
  }, []);

  useLoadGHBranchesIfEditable(edit);

  const loadingBranches = useSelector(selectGHLoadingBranches);

  return (
    <div className={classes.repoSelector}>
      <Tooltip
        title='An existing branch used as starting point for the Clapy branch. The PR will pull the Clapy branch into this branch.'
        disableInteractive
        placement={appConfig.tooltipPosition}
      >
        <Autocomplete<string>
          value={selectedTargetBranch || null}
          loading={loadingBranches}
          size='small'
          className={classes.repoAutocomplete}
          options={branches /* && !loadingBranches */ ? branches : []}
          getOptionLabel={branch => branch}
          renderInput={params => (
            <TextField
              {...params}
              label='Target branch for the PR'
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
          onChange={setBranch}
          onClose={endEdit}
          disabled={!edit || isLoading}
          blurOnSelect
          selectOnFocus
          clearOnBlur
          handleHomeEndKeys
        />
      </Tooltip>
      {!edit && (
        <Button variant='outlined' onClick={startEdit} disabled={isLoading}>
          {hasTargetBranchSelected ? 'Change' : 'Choose'}
        </Button>
      )}
    </div>
  );
});
