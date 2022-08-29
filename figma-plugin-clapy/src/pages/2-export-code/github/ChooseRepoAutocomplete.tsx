import Button from '@mui/material/Button';
import type { FC } from 'react';
import { useRef, useCallback, memo, useState } from 'react';
import { useSelector } from 'react-redux';
import classes from './GithubOption.module.css';
import Autocomplete from '@mui/material/Autocomplete/Autocomplete.js';
import { useCallbackAsync2 } from '../../../front-utils/front-utils.js';
import { selectGHHasRepoSelected, selectGHLoadingRepos, selectGHRepos, selectGHSelectedRepo } from './github-slice.js';
import TextField from '@mui/material/TextField/TextField.js';
import { env } from '../../../environment/env.js';
import { selectRepoInGHWizard, useLoadGHReposIfEditable } from './github-service.js';
import { Loading } from '../../../components-used/Loading/Loading.js';

interface Props {}

// We add a '&' because it's a forbidden character in github, so it won't collide with other entries.
const newRepoKey = '&new_repo';

export const ChooseRepoAutocomplete: FC<Props> = memo(function ChooseRepoAutocomplete(props) {
  const repos = useSelector(selectGHRepos);
  const hasRepoSelected = useSelector(selectGHHasRepoSelected);
  const selectedRepo = useSelector(selectGHSelectedRepo);
  const autocompleteValueRef = useRef(selectedRepo);
  const [edit, setEdit] = useState(!hasRepoSelected);
  // const repoSelectionRef = useRef<string | null>(null);

  const startEdit = useCallbackAsync2(() => {
    setEdit(true);
  }, []);
  const endEdit = useCallback(() => setEdit(false), []);
  const selectRepo = useCallbackAsync2(async (_, repo: string | null) => {
    selectRepoInGHWizard(repo);
  }, []);

  useLoadGHReposIfEditable(edit);

  const loadingRepos = useSelector(selectGHLoadingRepos);

  if (loadingRepos) {
    return (
      <>
        <Loading />
        repo
      </>
    );
  }

  if (!repos?.length) {
    // TODO after loading the github settings, when the selected repo is filled, initialize the list of repos with a special value containing only the selection.
    // When editing it, it should start loading the repos, and show somewhat it is loading in the Autocomplete.
    if (env.isDev) {
      throw new Error('BUG ChooseRepoAutocomplete - Repositories should be defined here.');
    }
    return null;
  }

  return (
    <>
      <div className={classes.repoSelector}>
        <Autocomplete<string>
          defaultValue={autocompleteValueRef.current}
          loading={true /* loadingRepos */}
          size='small'
          className={classes.repoAutocomplete}
          options={repos}
          getOptionLabel={repo => repo}
          renderInput={params => <TextField {...params} label='Repository' />}
          onChange={selectRepo}
          onClose={endEdit}
          disabled={!edit && hasRepoSelected}
          blurOnSelect
          selectOnFocus
          clearOnBlur
          handleHomeEndKeys
        />
        <Button variant='outlined' onClick={startEdit}>
          {hasRepoSelected ? 'Change' : 'Choose'}
        </Button>
      </div>
      <p>
        Your organization repository is not in the list? You may need to{' '}
        <a href={env.githubOAuthAppUrl} target={'_blank'} rel='noreferrer'>
          grant access to the Clapy OAuth app here.
        </a>
      </p>
    </>
  );
});
