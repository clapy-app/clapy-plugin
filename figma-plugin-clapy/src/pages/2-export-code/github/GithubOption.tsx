import type { FC } from 'react';
import { useCallback, memo } from 'react';
import { useSelector } from 'react-redux';
import { Loading } from '../../../components-used/Loading/Loading.js';
import { env } from '../../../environment/env.js';
import { useCallbackAsync2 } from '../../../front-utils/front-utils.js';
import { AbortableButton } from './components/AbortableButton.js';
import { signInToGithubWithScope, useLoadGHRepos } from './github-service.js';
import {
  selectGHAccessToken,
  selectGHHasPermission,
  selectGHLoadingRepos,
  selectGHRepos,
  selectGHSignInAborter,
  selectGHSignInLoading,
} from './github-slice.js';

interface Props {}

export const GithubOption: FC<Props> = memo(function GithubOption(props) {
  // useLoadGithubInitialState();

  const loadingRepos = useSelector(selectGHLoadingRepos);
  const token = useSelector(selectGHAccessToken);
  const hasPermission = useSelector(selectGHHasPermission);

  let signInLoading = useSelector(selectGHSignInLoading);
  const signInAborter = useSelector(selectGHSignInAborter);
  const ghSignIn = useCallbackAsync2(() => signInToGithubWithScope(), []);
  const cancel = useCallback(() => signInAborter?.(), [signInAborter]);

  // 1. Fetch the list of repositories. It automatically fetches the token if required. If unavailable, the selectors below will prompt the user to sign in with GitHub.
  useLoadGHRepos();

  // 1.b if the initial token is missing, prompt to sign in.
  if (loadingRepos) {
    return <Loading />;
  }
  if (!token) {
    return (
      <AbortableButton onClick={ghSignIn} onCancel={cancel} loading={signInLoading}>
        Sign in with Github
      </AbortableButton>
    );
  }
  // 1.c if there is a token but permissions are missing, prompt them.
  if (!hasPermission) {
    return (
      <>
        <p>Clapy needs extra GitHub permissions to push the generated code to your repository.</p>
        <AbortableButton onClick={ghSignIn} onCancel={cancel}>
          Add GitHub permissions
        </AbortableButton>
      </>
    );
  }
  return (
    <>
      {/* List the repositories. The user should pick one. */}
      <ChooseRepo />
      <p>
        Your organization repository is not in the list? You may need to{' '}
        <a href={env.githubOAuthAppUrl} target={'_blank'} rel='noreferrer'>
          grant access to the Clapy OAuth app here.
        </a>
      </p>
    </>
  );
});

export const ChooseRepo: FC<Props> = memo(function ChooseRepo(props) {
  const repos = useSelector(selectGHRepos);
  if (!repos?.length) {
    return null;
  }
  // TODO: pick a repository
  return <>{repos.length} repositories</>;
});
