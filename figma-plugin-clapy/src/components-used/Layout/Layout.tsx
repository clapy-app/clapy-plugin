import { FC, memo, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import { fetchPluginNoResponse, subscribePlugin } from '../../common/plugin-utils';
import { selectAuthLoading, selectSignedIn } from '../../core/auth/auth-slice';
import { env } from '../../environment/env';
import { FillUserProfile } from '../../pages/user/FillUserProfile/FillUserProfile';
import { FillUserProfileStep2 } from '../../pages/user/FillUserProfile/FillUserProfileStep2';
import { selectHasMissingMetaProfile, selectHasMissingMetaUsage } from '../../pages/user/user-slice';
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
  let hasMissingMetaProfile = useSelector(selectHasMissingMetaProfile);
  // hasMissingMetaProfile = true;
  let hasMissingMetaUsage = useSelector(selectHasMissingMetaUsage);
  // hasMissingMetaUsage = true;

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
          {isSignedIn && (
            <>
              {hasMissingMetaProfile && <FillUserProfile />}
              {!hasMissingMetaProfile && hasMissingMetaUsage && <FillUserProfileStep2 />}
              {!hasMissingMetaProfile && !hasMissingMetaUsage && (
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
        </>
      )}
      <Footer />
    </div>
  );
});
