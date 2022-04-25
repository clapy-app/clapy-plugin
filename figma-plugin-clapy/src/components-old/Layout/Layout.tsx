import { FC, memo, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import { subscribePlugin } from '../../common/plugin-utils';
import { selectSignedIn } from '../../features/auth/auth-slice';
import { CodeToFigma } from '../CodeToFigma/CodeToFigma';
import { FigmaToCodeHome } from '../FigmaToCodeHome/FigmaToCodeHome';
import { LoginHome } from '../LoginHome/LoginHome';
import { Footer } from './Footer/Footer';
import { Header } from './Header/Header';
import classes from './Layout.module.css';

// Flag for development only. Will be ignored in production.
// To disable sending to codesandbox, open the API controller and change the default of uploadToCsb
// backend-clapy/src/features/export-code/1-code-controller.ts
const sendToApi = true;

export type MyStates = 'loading' | 'noselection' | 'selection' | 'generated';

export const Layout: FC = memo(function Layout() {
  const [activeTab, setActiveTab] = useState(0);
  const [selectionPreview, setSelectionPreview] = useState<string | false | undefined>();
  const isSignedIn = useSelector(selectSignedIn);

  // Show selection
  useEffect(() => {
    const dispose = subscribePlugin('selectionPreview', (_, prev) => {
      setSelectionPreview(prev ? `data:image/jpeg;base64,${prev}` : prev);
    });
    return dispose;
  }, []);

  return (
    <div className={classes.root}>
      {!isSignedIn && <LoginHome />}
      {isSignedIn && (
        <>
          <Header activeTab={activeTab} selectTab={setActiveTab} />
          <div className={classes.content}>
            {activeTab === 0 && <FigmaToCodeHome selectionPreview={selectionPreview} />}
            {activeTab === 1 && <CodeToFigma />}
          </div>
        </>
      )}
      <Footer />
    </div>
  );
});
