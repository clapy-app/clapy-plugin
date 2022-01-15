import React, { useCallback, useEffect, useState } from 'react';
import Logo from './assets/logo.svg';
import Button from './components/Button';
import styles from './ui.module.scss';
import { login } from './utils/auth-service';
import { fetchPlugin, fetchPluginNoResponse } from './utils/ui-utils';


function useAccessToken() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any>();
  const [accessToken, setAccessToken] = useState<string>();
  useEffect(() => {
    fetchPlugin('getCachedToken')
      .then(token => {
        setLoading(false);
        setError(undefined);
        setAccessToken(token);
      })
      .catch(error => {
        setLoading(false);
        setError(error);
        setAccessToken(undefined);
      });
  }, []);
  return { loading, error, accessToken, setAccessToken };
}

const App = ({}) => {
  const textbox = React.useRef<HTMLInputElement>();

  const countRef = React.useCallback((element) => {
    if (element) element.value = '5';
    textbox.current = element;
  }, []);

  const { loading, error, accessToken, setAccessToken } = useAccessToken();

  const createRectangles = useCallback(() => {
    const count = parseInt(textbox.current?.value || '0', 10);
    fetchPlugin('createRectangles', count)
      .then(resp => console.log(`Figma Says: ${resp}`))
      .catch(err => console.error('err:', err));
  }, []);
  const loginBtn = useCallback(() => {
    login()
      .then(token => setAccessToken(token))
      .catch(err => console.error(err));
  }, []);

  const closePlugin = useCallback(() => {
    fetchPluginNoResponse('closePlugin');
  }, []);

  if (loading) return <p>Loading authentication status...</p>;
  if (error) return <p>Could not check the authentication status.</p>

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
        <Button onClick={closePlugin} secondary>
          Cancel
        </Button>
      </div>
      <p>Access token: {accessToken}</p>
    </div>
  );
};

export default App;
