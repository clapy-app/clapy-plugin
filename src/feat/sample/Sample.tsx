import { FC, memo, useCallback, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { fetchPluginNoResponse, subscribePlugin } from '../../common/plugin-utils';
import { SelectedTextNode } from '../../common/text-node-models';
import { Button } from '../../components/Button';
import { TextItem } from '../../components/TextItem';
import { login, logout } from '../auth/auth-service';
import { selectAuthError, selectAuthLoading } from '../auth/auth-slice';
import { FetchApiSection } from './FetchApiSection';
import logo from './logo.svg';
import styles from './Sample.module.scss';

export const Sample: FC = memo(() => {
  const authLoading = useSelector(selectAuthLoading);
  const authError = useSelector(selectAuthError);

  const loginBtn = useCallback(() => login(), []);

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
      {/* <iframe id="inlineFrameExample"
        title="Inline Frame Example"
        width="300"
        height="200"
        srcDoc="https://www.openstreetmap.org/export/embed.html?bbox=-0.004017949104309083%2C51.47612752641776%2C0.00030577182769775396%2C51.478569861898606&layer=mapnik">
      </iframe> */}
      <img src={logo} />
      <div className={styles.buttonContainer}>
        <Button onClick={loginBtn}>Auth</Button>
        <Button onClick={logoutBtn}>Logout</Button>
        <Button onClick={closePlugin} secondary>
          Cancel
        </Button>
      </div>
      {authLoading
        ? <p>Loading authentication status...</p>
        : authError
          ? <p>Could not check the authentication status: {JSON.stringify(authError)}</p>
          : ''}

      <FetchApiSection />
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