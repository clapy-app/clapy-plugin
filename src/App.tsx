import { FC, memo, useCallback, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import styles from './App.module.scss';
import logo from './assets/logo.svg';
import { fetchPluginNoResponse, subscribePlugin } from './common/plugin-utils';
import { SelectedTextNode } from './common/text-node-models';
import { Button } from './components/Button';
import { TextItem } from './components/TextItem';
import { useGetWorksQuery } from './feat/api-sample';
import { login, logout } from './feat/auth/auth-service';
import { selectAuthError, selectAuthLoading } from './feat/auth/auth-slice';

export const App: FC = memo(() => {
  const authLoading = useSelector(selectAuthLoading);
  const authError = useSelector(selectAuthError);

  const loginBtn = useCallback(() => login(), []);

  const { isLoading, error, data, refetch } = useGetWorksQuery();

  const refetchBtn = useCallback(() => refetch(), []);

  const logoutBtn = useCallback(() => logout(), []);

  const closePlugin = useCallback(() => {
    fetchPluginNoResponse('closePlugin');
  }, []);

  // Text selection sync

  const [selectedTextNodes, setSelectedTextNodes] = useState<SelectedTextNode[]>([]);

  const handleUpdateText = useCallback((figmaNodeID, updatedText) => {
    fetchPluginNoResponse('updateText', figmaNodeID, updatedText);
  }, []);

  useEffect(() => {
    const dispose = subscribePlugin('selectedTextNodes', (_, nodes) => {
      setSelectedTextNodes(nodes);
    });
    fetchPluginNoResponse('getText');
    return dispose;
  }, []);

  return (
    <div className={styles.container}>
      <img src={logo} />
      <div className={styles.buttonContainer}>
        <Button onClick={loginBtn}>Auth</Button>
        <Button onClick={refetchBtn}>Refetch API</Button>
        <Button onClick={logoutBtn}>Logout</Button>
        <Button onClick={closePlugin} secondary>
          Cancel
        </Button>
      </div>
      {authLoading
        ? <p>Loading authentication status...</p>
        : authError
          ? <p>Could not check the authentication status: {JSON.stringify(authError)}</p>
          : isLoading
            ? <p>Loading API sample...</p>
            : error
              ? <p>Could not fetch the API sample: {JSON.stringify(error.message || error)}</p>
              : <p>API result: {JSON.stringify(data)}</p>}

      <div>
        {selectedTextNodes.length === 0 && <div className="select-warning">Select some text in Figma that you wish to edit.</div>}
        <div className="textList">
          {selectedTextNodes.map((node, index) => (
            <TextItem
              key={index}
              node={node}
              handleUpdateText={handleUpdateText}
            />
          ))}
        </div>
      </div>
    </div>
  );
});
