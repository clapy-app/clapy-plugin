import { FC, memo, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import { LoginHome } from '../0-login/LoginHome/LoginHome';
import loginHomeClasses from '../0-login/LoginHome/LoginHome.module.css';
import { CodeToFigma } from '../1-import-sb/CodeToFigma/CodeToFigma';
import { ErrorComp } from '../1-import-sb/detail/ErrorComp';
import { FigmaToCodeHome } from '../2-export-code/FigmaToCodeHome/FigmaToCodeHome';
import { fetchPluginNoResponse, subscribePlugin } from '../../common/plugin-utils';
import { Loading } from '../../components-used/Loading/Loading';
import { selectAuthError, selectAuthLoading, selectSignedIn } from '../../core/auth/auth-slice';
import { env } from '../../environment/env';
import { FillUserProfile } from '../user/FillUserProfile/FillUserProfile';
import { FillUserProfileStep2 } from '../user/FillUserProfile/FillUserProfileStep2';
import { selectHasMissingMetaProfile, selectHasMissingMetaUsage } from '../user/user-slice';
import { Footer } from './Footer/Footer';
import { Header } from './Header/Header';
import classes from './Layout.module.css';

// Flag for development only. Will be ignored in production.
// To disable sending to codesandbox, open the API controller and change the default of uploadToCsb
// backend-clapy/src/features/export-code/1-code-controller.ts
const sendToApi = true;

export type MyStates = 'loading' | 'noselection' | 'selection' | 'generated';

export const Layout: FC = memo(function Layout() {
  return (
    <div className={classes.root}>
      <LayoutInner />
      <Footer />
    </div>
  );
});

export const LayoutInner: FC = memo(function LayoutInner() {
  const [activeTab, setActiveTab] = useState(0);
  const [selectionPreview, setSelectionPreview] = useState<string | false | undefined>();
  const authLoading = useSelector(selectAuthLoading);
  const authError = useSelector(selectAuthError);
  const isSignedIn = useSelector(selectSignedIn);
  let hasMissingMetaProfile = useSelector(selectHasMissingMetaProfile);
  // hasMissingMetaProfile = false;
  let hasMissingMetaUsage = useSelector(selectHasMissingMetaUsage);
  // hasMissingMetaUsage = false;

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

  if (authError) {
    return (
      <div className={loginHomeClasses.content}>
        <ErrorComp error={authError} />
      </div>
    );
  }

  if (authLoading)
    return (
      <div className={loginHomeClasses.content}>
        <Loading />
      </div>
    );

  if (!isSignedIn) return <LoginHome />;

  if (hasMissingMetaProfile) return <FillUserProfile />;

  if (hasMissingMetaUsage) return <FillUserProfileStep2 />;

  return (
    <>
      <Header activeTab={activeTab} selectTab={setActiveTab} />
      <div className={classes.content}>
        {activeTab === 0 && <FigmaToCodeHome selectionPreview={selectionPreview} />}
        {activeTab === 1 && <CodeToFigma />}
      </div>
    </>
  );
});
