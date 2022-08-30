import Button from '@mui/material/Button';
import type { FC } from 'react';
import { useRef, useCallback, memo, useState } from 'react';
import { useSelector } from 'react-redux';
import classes from './GithubOption.module.css';
import Autocomplete from '@mui/material/Autocomplete/Autocomplete.js';
import { useCallbackAsync2 } from '../../../front-utils/front-utils.js';
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
  const autocompleteValueRef = useRef(selectedRepo);
  const [edit, setEdit] = useState(!hasRepoSelected);

  const startEdit = useCallbackAsync2(() => {
    setEdit(true);
  }, []);
  const endEdit = useCallback(() => setEdit(false), []);
  const selectRepo = useCallbackAsync2(async (_, repo: string | null) => {
    selectRepoInGHWizard(repo);
  }, []);

  useLoadGHReposIfEditable(edit);

  const loadingRepos = useSelector(selectGHLoadingRepos);

  if (!repos?.length && !loadingRepos) {
    if (env.isDev) {
      throw new Error('BUG ChooseRepoAutocomplete - Repositories should be defined here.');
    }
  }

  return (
    <>
      <div className={classes.repoSelector}>
        <Autocomplete<string>
          defaultValue={autocompleteValueRef.current}
          loading={true /* loadingRepos */}
          size='small'
          className={classes.repoAutocomplete}
          options={repos && !loadingRepos ? repos : []}
          getOptionLabel={repo => repo}
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
          disabled={!edit && hasRepoSelected}
          blurOnSelect
          selectOnFocus
          clearOnBlur
          handleHomeEndKeys
        />
        {!edit && (
          <Button variant='outlined' onClick={startEdit}>
            {hasRepoSelected ? 'Change' : 'Choose'}
          </Button>
        )}
      </div>
      <p>
        Your organization&apos;s repositories are not in the list? You may need to{' '}
        <a href={env.githubOAuthAppUrl} target={'_blank'} rel='noreferrer'>
          grant access to the Clapy OAuth app here.
        </a>
      </p>
    </>
  );
});
