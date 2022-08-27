import Button from '@mui/material/Button/Button.js';
import type { FC } from 'react';
import { useCallback, memo } from 'react';
import { useSelector } from 'react-redux';
import { Loading } from '../../../components-used/Loading/Loading.js';
import { useAppDispatch } from '../../../core/redux/hooks.js';
import { env } from '../../../environment/env.js';
import { useCallbackAsync2 } from '../../../front-utils/front-utils.js';
import { AbortableButton } from './components/AbortableButton.js';
import { signInToGithubWithScope, useLoadGithubInitialState } from './github-service.js';
import {
  endGHSignIn,
  selectGHAccessToken,
  selectGHHasPermission,
  selectGHInitialLoadingDone,
  selectGHSignInAborter,
  selectGHSignInLoading,
  startGHSignIn,
} from './github-slice.js';

interface Props {}

export const GithubOption: FC<Props> = memo(function GithubOption(props) {
  const dispatch = useAppDispatch();
  // 1. fetch the token in cache, to check if the user has to sign in with Github
  useLoadGithubInitialState();

  const initialLoadingDone = useSelector(selectGHInitialLoadingDone);
  const token = useSelector(selectGHAccessToken);
  const hasPermission = useSelector(selectGHHasPermission);

  let signInLoading = useSelector(selectGHSignInLoading);
  const signInAborter = useSelector(selectGHSignInAborter);
  const requestRepoScope = useCallbackAsync2(async () => {
    try {
      const aborter = new AbortController();
      dispatch(startGHSignIn({ signInAborter: aborter }));
      await signInToGithubWithScope(aborter);
    } finally {
      dispatch(endGHSignIn());
    }
  }, [dispatch]);
  const cancel = useCallback(() => signInAborter?.(), [signInAborter]);
  // const requestRepoScope = useCallbackAsync2(async () => {
  // // Later, for other operations with github:
  // let githubAccessToken = await fetchPlugin('getGithubCachedCredentials');
  // // await requestAdditionalScopes(['repo', 'user:email']);
  // const { data } = await apiPost<ListReposResp>('github/list-repos', {
  //   githubAccessToken,
  // } as ListReposReq);
  // let repositories: GHRepo[];
  // ({ githubAccessToken, repositories } = data);
  // await fetchPlugin('setGithubCachedCredentials', githubAccessToken);
  // console.log('repositories:', repositories);
  // }, []);

  // 1.b if the initial token is missing, prompt to sign in.
  if (!initialLoadingDone) {
    return <Loading />;
  }
  if (!token) {
    return (
      <AbortableButton onClick={requestRepoScope} onCancel={cancel} loading={signInLoading}>
        Sign in with Github
      </AbortableButton>
    );
  }
  // 1.c if there is a token but permissions are missing, prompt them.
  if (!hasPermission) {
    return (
      <>
        <p>Clapy needs extra GitHub permissions to push the generated code to your repository.</p>
        <AbortableButton onClick={requestRepoScope} onCancel={cancel}>
          Add GitHub permissions
        </AbortableButton>
      </>
    );
  }
  return (
    <>
      <Button onClick={requestRepoScope}>Add scopes</Button>
      <p>
        Your organization repository is not in the list? You may need to{' '}
        <a href={env.githubOAuthAppUrl} target={'_blank'} rel='noreferrer'>
          grant access to the Clapy OAuth app here.
        </a>
      </p>
    </>
  );
});
