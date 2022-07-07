import type { FC } from 'react';
import { memo, useState } from 'react';
import { useSelector } from 'react-redux';

import { LoginHome } from '../0-login/LoginHome/LoginHome';
import loginHomeClasses from '../0-login/LoginHome/LoginHome.module.css';
import { ErrorComp } from '../1-import-sb/detail/ErrorComp';
import { Account } from '../3-Account/Account';
import { Generator } from '../4-Generator/Generator';
import { Loading } from '../../components-used/Loading/Loading';
import { selectAuthError, selectAuthLoading, selectSignedIn } from '../../core/auth/auth-slice';
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
  const authLoading = useSelector(selectAuthLoading);
  const authError = useSelector(selectAuthError);
  const isSignedIn = useSelector(selectSignedIn);
  let hasMissingMetaProfile = useSelector(selectHasMissingMetaProfile);
  // hasMissingMetaProfile = false;
  let hasMissingMetaUsage = useSelector(selectHasMissingMetaUsage);
  // hasMissingMetaUsage = false;

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
      {activeTab === 0 && (
        <div className={classes.generatorContent}>
          <Generator />
        </div>
      )}
      {activeTab === 1 && (
        <div className={classes.generatorContent}>
          <Account />
        </div>
      )}
    </>
  );
});
