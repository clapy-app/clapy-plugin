import { FC, memo, useCallback, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import { fetchPluginNoResponse, subscribePlugin } from '../../common/plugin-utils';
import { selectAuthLoading, selectSignedIn } from '../../core/auth/auth-slice';
import { env } from '../../environment/env';
import { FillUserProfile } from '../../pages/user/FillUserProfile/FillUserProfile';
import { findUserMetadata, updateUserMetadata, UserMetadata } from '../../pages/user/user-service';
import { selectHasMissingMetadata } from '../../pages/user/user-slice';
import { CodeToFigma } from '../CodeToFigma/CodeToFigma';
import { FigmaToCodeHome } from '../FigmaToCodeHome/FigmaToCodeHome';
import { Loading } from '../Loading/Loading';
import { LoginHome } from '../LoginHome/LoginHome';
import loginHomeClasses from '../LoginHome/LoginHome.module.css';
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
  const authLoading = useSelector(selectAuthLoading);
  const isSignedIn = useSelector(selectSignedIn);
  const hasMissingMetadata = useSelector(selectHasMissingMetadata);

  // Show selection
  useEffect(() => {
    const dispose = subscribePlugin('selectionPreview', (_, prev) => {
      setSelectionPreview(prev ? `data:image/jpeg;base64,${prev}` : prev);
    });
    if (env.isDev) {
      fetchPluginNoResponse('getSelectionPreview');
    }
    return dispose;
  }, []);

  const updateMetadata = useCallback(() => {
    (async () => {
      // TODO in auth, after loading the token, call the API to fetch user metadata.
      // Update the redux state with it, and add a selector here to read them.
      // authLoading should not be false before metadata are available.
      // If at least 1 missing metadata, route to the form asking to provide the data.
      // Prefill with the data available, etc.
      const payload: UserMetadata = {
        firstName: 'Antoine2',
        lastName: 'ORY-LAMBALLE2',
        companyName: 'Clapy',
        jobTitle: 'Tech co-founder',
        techTeamSize: '1_10',
      };
      await updateUserMetadata(payload);
      console.log(await findUserMetadata());
    })();
  }, []);

  return (
    <div className={classes.root}>
      {/* <Button onClick={updateMetadata}>Update metadata</Button> */}
      {authLoading && (
        <div className={loginHomeClasses.content}>
          <Loading />
        </div>
      )}
      {!authLoading && (
        <>
          {!isSignedIn && <LoginHome />}
          {isSignedIn && hasMissingMetadata && <FillUserProfile />}
          {isSignedIn && !hasMissingMetadata && (
            <>
              <Header activeTab={activeTab} selectTab={setActiveTab} />
              <div className={classes.content}>
                {activeTab === 0 && <FigmaToCodeHome selectionPreview={selectionPreview} />}
                {activeTab === 1 && <CodeToFigma />}
              </div>
            </>
          )}
        </>
      )}
      <Footer />
    </div>
  );
});
