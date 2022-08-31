import Button from '@mui/material/Button';
import type { FC } from 'react';
import { useCallback, memo, useState } from 'react';
import { useSelector } from 'react-redux';
import classes from './GithubOption.module.css';
import Autocomplete from '@mui/material/Autocomplete/Autocomplete.js';
import { useCallbackAsync2 } from '../../../front-utils/front-utils.js';
import type { Repo } from './github-slice.js';
import {
  selectGHHasRepoSelected,
  selectGHLoadingRepos,
  selectGHReposOrJustSelection,
  selectGHSelectedRepo,
} from './github-slice.js';
import TextField from '@mui/material/TextField/TextField.js';
import { env } from '../../../environment/env.js';
import { selectRepoInGHWizard, useLoadGHReposIfEditable } from './github-service.js';
import CircularProgress from '@mui/material/CircularProgress/CircularProgress.js';

interface Props {}

// Later, if we want to add new repositories.
// We add a '&' because it's a forbidden character in github, so it won't collide with other entries.
// const newRepoKey = '&new_repo';

export const ChooseRepoAutocomplete: FC<Props> = memo(function ChooseRepoAutocomplete(props) {
  const repos = useSelector(selectGHReposOrJustSelection);
  const hasRepoSelected = useSelector(selectGHHasRepoSelected);
  const selectedRepo = useSelector(selectGHSelectedRepo);
  const [edit, setEdit] = useState(!hasRepoSelected);

  const startEdit = useCallbackAsync2(() => {
    setEdit(true);
  }, []);
  const endEdit = useCallback(() => setEdit(false), []);
  const selectRepo = useCallbackAsync2(async (_, repo: Repo | null) => {
    selectRepoInGHWizard(repo);
  }, []);

  useLoadGHReposIfEditable(edit);

  const showEdit = edit || !hasRepoSelected;

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
          disabled={!showEdit}
          blurOnSelect
          selectOnFocus
          clearOnBlur
          handleHomeEndKeys
        />
        {!showEdit && (
          <Button variant='outlined' onClick={startEdit}>
            {hasRepoSelected ? 'Change' : 'Choose'}
          </Button>
        )}
      </div>
      {showEdit && (
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
