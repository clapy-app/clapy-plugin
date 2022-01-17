import { FC, memo, useCallback, useRef } from 'react';
import { useSelector } from 'react-redux';
import Logo from './assets/logo.svg';
import { login } from './auth/auth-service';
import { selectAuthError, selectAuthLoading } from './auth/auth-slice';
import { Button } from './components/Button';
import { useGetWorksQuery } from './feat/api-sample';
import styles from './ui.module.scss';
import { fetchPlugin, fetchPluginNoResponse } from './utils/ui-utils';

export const App: FC = memo(() => {
  const textbox = useRef<HTMLInputElement>();

  const countRef = useCallback((element) => {
    if (element) element.value = '5';
    textbox.current = element;
  }, []);

  const authLoading = useSelector(selectAuthLoading);
  const authError = useSelector(selectAuthError);

  const createRectangles = useCallback(() => {
    const count = parseInt(textbox.current?.value || '0', 10);
    fetchPlugin('createRectangles', count)
      .then(resp => console.log(`Figma Says: ${resp}`))
      .catch(err => console.error('err:', err));
  }, []);

  const loginBtn = useCallback(() => login(), []);

  const { isLoading, error, data, refetch } = useGetWorksQuery();

  const refetchBtn = useCallback(() => refetch(), []);

  const closePlugin = useCallback(() => {
    fetchPluginNoResponse('closePlugin');
  }, []);

  if (authLoading) return <p>Loading authentication status...</p>;
  if (authError) return <p>Could not check the authentication status: {JSON.stringify(authError)}</p>;

  return (
    <div className={styles.container}>
      <Logo />
      <h2>Rectangle Creator</h2>
      <p>
        Count: <input ref={countRef} />
      </p>
      <div className={styles.buttonContainer}>
        <Button onClick={createRectangles}>Create</Button>
        <Button onClick={loginBtn}>Auth</Button>
        <Button onClick={refetchBtn}>Refetch API</Button>
        <Button onClick={closePlugin} secondary>
          Cancel
        </Button>
      </div>
      {isLoading
        ? <p>Loading API sample...</p>
        : error
          ? <p>Could not fetch the API sample: {JSON.stringify(error.message || error)}</p>
          : <p>API result: {JSON.stringify(data)}</p>}
    </div>
  );
});
