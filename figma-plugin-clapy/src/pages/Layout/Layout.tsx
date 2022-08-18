import type { FC } from 'react';
import { memo, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import { LoginHome } from '../0-login/LoginHome/LoginHome';
import loginHomeClasses from '../0-login/LoginHome/LoginHome.module.css';
import { CodeToFigma } from '../1-import-sb/CodeToFigma/CodeToFigma.js';
import { ErrorComp } from '../1-import-sb/detail/ErrorComp';
import { setSelection } from '../2-export-code/export-code-slice.js';
import { FigmaToCodeHome } from '../2-export-code/FigmaToCodeHome/FigmaToCodeHome.js';
import { Account } from '../3-Account/Account.js';
import { Pricing } from '../3-Account/Pricing/Pricing.js';
import { selectFeedbackPageState, selectPricingPageState, selectStripeState } from '../3-Account/stripe-slice.js';
import { Generator } from '../4-Generator/Generator.js';
import { Feedback } from '../5-Feedback/Feedback';
import { fetchPlugin, fetchPluginNoResponse, subscribePlugin } from '../../common/plugin-utils.js';
import { Loading } from '../../components-used/Loading/Loading.js';
import {
  selectAuthError,
  selectIsStripeEnabled,
  selectSessionChecking,
  selectSignedIn,
} from '../../core/auth/auth-slice';
import { useAppDispatch } from '../../core/redux/hooks.js';
import { FillUserProfile } from '../user/FillUserProfile/FillUserProfile';
import { FillUserProfileStep2 } from '../user/FillUserProfile/FillUserProfileStep2';
import { selectHasMissingMetaProfile, selectHasMissingMetaUsage } from '../user/user-slice';
import { Footer } from './Footer/Footer';
import { Header } from './Header/Header.js';
import { HeaderGenerator } from './Header/Header_Generator.js';
import classes from './Layout.module.css';

// Flag for development only. Will be ignored in production.
import { handleError, toastError } from '../../front-utils/front-utils.js';
import alertClasses from '../../components-used/ErrorAlert/NewUpdateAlert.module.css';
import { toast } from 'react-toastify';
import { ErrorAlert2, ErrorAlertButtons } from '../../components-used/ErrorAlert/ErrorAlert.js';
// To disable sending to codesandbox, open the API controller and change the default of uploadToCsb
// backend-clapy/src/features/export-code/1-code-controller.ts
const sendToApi = true;

export type MyStates = 'loading' | 'noselection' | 'selection' | 'generated';
let alreadyToasted = false;

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
  const authError = useSelector(selectAuthError);
  const stripeLoading = useSelector(selectStripeState);
  const isSignedIn = useSelector(selectSignedIn);
  const stateChecking = useSelector(selectSessionChecking);
  let hasMissingMetaProfile = useSelector(selectHasMissingMetaProfile);
  // hasMissingMetaProfile = false;
  let hasMissingMetaUsage = useSelector(selectHasMissingMetaUsage);
  // hasMissingMetaUsage = false;
  // Show selection

  // use this flag after the tests
  const isStripeEnabled = useSelector(selectIsStripeEnabled);
  const isFeedbackPageActive = useSelector(selectFeedbackPageState);
  const isPricingPageActive = useSelector(selectPricingPageState);
  const dispatch = useAppDispatch();

  useEffect(() => {
    const dispose = subscribePlugin('selectionPreview', (error, prev) => {
      const previewUrl = prev ? `data:image/jpeg;base64,${prev}` : prev;
      dispatch(setSelection(previewUrl));
    });
    async function setFirstLoginStatus() {
      try {
        const cachedInfo = await fetchPlugin('getCachedIsFirstLogin');
        if (isSignedIn && !cachedInfo && !alreadyToasted) {
          alreadyToasted = true;
          toast(
            <ErrorAlert2 isInfo={true}>
              <p className={alertClasses.textWrapper}>
                After months of Beta, we are launching Pro plans for{' '}
                <span className={alertClasses.label2}>priority support</span>, early access to{' '}
                <span className={alertClasses.label2}>new features</span>, and{' '}
                <span className={alertClasses.label2}>unlimited</span> code exports. Free plan includes monthly credits.
              </p>
            </ErrorAlert2>,
            {
              className: `${alertClasses.root}`,
              closeButton: ({ closeToast }) => (
                <ErrorAlertButtons
                  isInfo={true}
                  closeToast={e => {
                    closeToast(e);
                    fetchPluginNoResponse('setCachedIsFirstLogin');
                  }}
                  emailLink={'#'}
                />
              ),
            },
          );
        }
      } catch (error) {
        handleError(error);
        toastError(error);
      }
    }
    setFirstLoginStatus();
    fetchPluginNoResponse('getSelectionPreview');
    return dispose;
  }, [dispatch, isSignedIn]);
  if (authError) {
    return (
      <div className={loginHomeClasses.content}>
        <ErrorComp error={authError} />
      </div>
    );
  }
  if (stripeLoading || stateChecking)
    return (
      <div className={loginHomeClasses.content}>
        <Loading />
        {stateChecking && <p>Checking your session...</p>}
        {stripeLoading && (
          <p>The payment page is opening in your browser. Please complete the payment there, then come back here 🙏</p>
        )}
      </div>
    );

  if (!isSignedIn && !stateChecking) return <LoginHome />;

  if (hasMissingMetaProfile) return <FillUserProfile />;

  if (hasMissingMetaUsage) return <FillUserProfileStep2 />;

  if (isFeedbackPageActive) return <Feedback />;

  if (isPricingPageActive) return <Pricing />;

  return isStripeEnabled ? (
    <>
      <HeaderGenerator activeTab={activeTab} selectTab={setActiveTab} />
      {activeTab === 0 && <Generator />}
      {activeTab === 1 && <Account />}
    </>
  ) : (
    <>
      <Header activeTab={activeTab} selectTab={setActiveTab} />
      <div className={classes.content}>
        {activeTab === 0 && <FigmaToCodeHome />}
        {activeTab === 1 && <CodeToFigma />}
      </div>
    </>
  );
});
