import type { FC } from 'react';
import { useCallback, memo } from 'react';
import { useSelector } from 'react-redux';
import { Loading } from '../../../components-used/Loading/Loading.js';
import { useCallbackAsync2 } from '../../../front-utils/front-utils.js';
import { AbortableButton } from './components/AbortableButton.js';
import { signInToGithubWithScope, useLoadGHSettingsAndCredentials } from './github-service.js';
import {
  selectGHAccessToken,
  selectGHHasPermission,
  selectGHSignInAborter,
  selectGHSignInLoading,
  selectIsLoadingGHSettings,
} from './github-slice.js';
import { ChooseRepoAutocomplete } from './ChooseRepoAutocomplete.js';
import { ChooseBranchAutocomplete } from './ChooseBranchAutocomplete.js';
import { ChooseClapyBranch } from './ChooseClapyBranch.js';

interface Props {
  isLoading: boolean;
}

export const GithubOption: FC<Props> = memo(function GithubOption(props) {
  const { isLoading } = props;

  // 1. Fetch the settings and credentials. If unavailable, the selectors below will prompt the user to sign in with GitHub.
  useLoadGHSettingsAndCredentials();

  const isLoadingGHSettings = useSelector(selectIsLoadingGHSettings);
  const token = useSelector(selectGHAccessToken);
  const hasPermission = useSelector(selectGHHasPermission);

  let signInLoading = useSelector(selectGHSignInLoading);
  const signInAborter = useSelector(selectGHSignInAborter);
  const ghSignIn = useCallbackAsync2(() => signInToGithubWithScope(), []);
  const cancel = useCallback(() => signInAborter?.(), [signInAborter]);

  // 1.b if the initial token is missing, prompt to sign in.
  if (isLoadingGHSettings) {
    return <Loading />;
  }
  if (!token) {
    return (
      <AbortableButton onClick={ghSignIn} onCancel={cancel} loading={signInLoading} disabled={isLoading}>
        Sign in with Github
      </AbortableButton>
    );
  }
  // 1.c if there is a token but permissions are missing, prompt them.
  if (!hasPermission) {
    return (
      <>
        <p>Clapy needs extra GitHub permissions to push the generated code to your repository.</p>
        <AbortableButton onClick={ghSignIn} onCancel={cancel} disabled={isLoading}>
          Add GitHub permissions
        </AbortableButton>
      </>
    );
  }
  // 2. Github settings form
  return (
    <>
      {/* List the repositories. The user should pick one. */}
      <ChooseRepoAutocomplete isLoading={isLoading} />
      <ChooseBranchAutocomplete isLoading={isLoading} />
      <ChooseClapyBranch isLoading={isLoading} />
      {/* <SendToGithub /> */}
    </>
  );
});
