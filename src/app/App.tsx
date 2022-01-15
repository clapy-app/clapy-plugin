import React, { useCallback } from 'react';
import Logo from './assets/logo.svg';
import Button from './components/Button';
import styles from './ui.module.scss';
import { fetchPlugin, fetchPluginNoResponse } from './utils/uiUtils';

const App = ({}) => {
  const textbox = React.useRef<HTMLInputElement>();

  const countRef = React.useCallback((element) => {
    if (element) element.value = '5';
    textbox.current = element;
  }, []);

  const createRectangles = useCallback(() => {
    const count = parseInt(textbox.current?.value || '0', 10);
    fetchPlugin('createRectangles', count)
      .then(resp => console.log(`Figma Says: ${resp}`))
      .catch(err => console.error('err:', err));
  }, []);
  const login = useCallback(() => {
    fetchPlugin('getCachedToken')
      .then(token => console.log('Token client:', token))
      .catch(err => console.error('err:', err));
  }, []);

  const closePlugin = useCallback(() => {
    fetchPluginNoResponse('closePlugin');
  }, []);

  return (
    <div className={styles.container}>
      <Logo />
      <h2>Rectangle Creator29</h2>
      <p>
        Count: <input ref={countRef} />
      </p>
      <div className={styles.buttonContainer}>
        <Button onClick={createRectangles}>Create</Button>
        <Button onClick={login}>Auth</Button>
        <Button onClick={closePlugin} secondary>
          Cancel
        </Button>
      </div>
    </div>
  );
};

export default App;
