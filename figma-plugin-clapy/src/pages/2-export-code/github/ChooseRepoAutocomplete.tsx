import Autocomplete from '@mui/material/Autocomplete/Autocomplete.js';
import Button from '@mui/material/Button/Button.js';
import CircularProgress from '@mui/material/CircularProgress/CircularProgress.js';
import TextField from '@mui/material/TextField/TextField.js';
import type { FC } from 'react';
import { memo, useCallback, useState } from 'react';
import { useSelector } from 'react-redux';

import { env } from '../../../environment/env.js';
import { useCallbackAsync2 } from '../../../front-utils/front-utils.js';
import { selectRepoInGHWizard, useLoadGHReposIfEditable } from './github-service.js';
import type { Repo } from './github-slice.js';
import {
  selectGHHasRepoSelected,
  selectGHLoadingRepos,
  selectGHReposOrJustSelection,
  selectGHSelectedRepo,
} from './github-slice.js';
import classes from './GithubOption.module.css';

interface Props {
  isLoading: boolean;
}

// Later, if we want to add new repositories.
// We add a '&' because it's a forbidden character in github, so it won't collide with other entries.
// const newRepoKey = '&new_repo';

export const ChooseRepoAutocomplete: FC<Props> = memo(function ChooseRepoAutocomplete(props) {
  const { isLoading } = props;

  const repos = useSelector(selectGHReposOrJustSelection);
  const hasRepoSelected = useSelector(selectGHHasRepoSelected);
  const selectedRepo = useSelector(selectGHSelectedRepo);
  const [_edit, setEdit] = useState(!hasRepoSelected);
  const edit = _edit || !hasRepoSelected;

  const startEdit = useCallback(() => setEdit(true), []);
  const endEdit = useCallback(() => setEdit(false), []);
  const selectRepo = useCallbackAsync2(async (_, repo: Repo | null) => {
    await selectRepoInGHWizard(repo);
  }, []);

  useLoadGHReposIfEditable(edit);

  const loadingRepos = useSelector(selectGHLoadingRepos);

  return (
    <>
      <div className={classes.repoSelector}>
        <Autocomplete<Repo>
          value={selectedRepo || null}
          loading={loadingRepos}
          size='small'
          className={classes.repoAutocomplete}
          options={repos /* && !loadingRepos */ ? repos : []}
          getOptionLabel={repo => repo.full_name}
          renderInput={params => (
            <TextField
              {...params}
              label='Repository'
              InputProps={{
                ...params.InputProps,
                endAdornment: (
                  <>
                    {loadingRepos ? <CircularProgress color='inherit' size={20} /> : null}
                    {params.InputProps.endAdornment}
                  </>
                ),
              }}
            />
          )}
          onChange={selectRepo}
          onClose={endEdit}
          disabled={!edit || isLoading}
          blurOnSelect
          selectOnFocus
          clearOnBlur
          handleHomeEndKeys
        />
        {!edit && (
          <Button variant='text' onClick={startEdit} disabled={isLoading}>
            {hasRepoSelected ? 'Change' : 'Choose'}
          </Button>
        )}
      </div>
      {edit && (
        <p>
          Your organization&apos;s repositories are not in the list? You may need to{' '}
          <a href={env.githubOAuthAppUrl} target={'_blank'} rel='noreferrer'>
            grant access to the Clapy OAuth app here.
          </a>
        </p>
      )}
    </>
  );
});
