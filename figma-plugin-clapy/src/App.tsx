import createTheme from '@mui/material/styles/createTheme';
import ThemeProvider from '@mui/material/styles/ThemeProvider';
import type { FC } from 'react';
import { memo, useEffect } from 'react';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import classes from './App.module.css';
import { track } from './common/analytics';
import { getDuration } from './common/general-utils';
import alertClasses from './components-used/ErrorAlert/ErrorAlert.module.css';
import { checkSessionLight, isAuthError } from './core/auth/auth-service.js';
import { setAuthError, setSignedInState } from './core/auth/auth-slice.js';
import { useAppDispatch } from './core/redux/hooks.js';
import { dispatchOther } from './core/redux/redux.utils.js';
import { env } from './environment/env.js';
import { handleError, toastError } from './front-utils/front-utils.js';
import { Layout } from './pages/Layout/Layout';
import { setStripeData } from './pages/user/user-slice.js';

declare module '@mui/material/styles' {
  interface Palette {
    neutral: Palette['primary'];
  }
  interface PaletteOptions {
    neutral: PaletteOptions['primary'];
  }
}

// Update the Button's color prop options
declare module '@mui/material/Button' {
  interface ButtonPropsColorOverrides {
    neutral: true;
  }
}
const theme = createTheme({
  palette: {
    primary: {
      main: '#155eef',
    },
    neutral: {
      main: '#101828',
    },
  },
  typography: {
    // "Nunito Sans"
    fontFamily:
      'Inter, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", "Liberation Sans", sans-serif',
  },
  components: {
    MuiFormGroup: { styleOverrides: { root: { columnGap: 16 } } },
    MuiFormControlLabel: { styleOverrides: { root: { marginRight: 0 } } },
    MuiButton: {
      defaultProps: {
        disableRipple: true,
      },
      styleOverrides: {
        root: ({ ownerState, theme }) => ({
          textTransform: 'none',
          fontSize: 16,
          fontWeight: 500,
          borderRadius: 8,
          ...(ownerState.variant === 'outlined' &&
            ownerState.color === 'neutral' && {
              borderColor: '#d0d5dd',
            }),
          ...(ownerState.variant === 'outlined' &&
            ownerState.color === 'primary' && {
              borderColor: '#004eeb',
              color: '#004eeb',
            }),
        }),
      },
    },
  },
});

const openPluginTime = performance.now();

// Ideally, we should use document.addEventListener('visibilitychange', ...) but it doesn't work and triggers with alt+tab (undesired).
window.addEventListener('unload', function () {
  const durationInS = getDuration(openPluginTime, performance.now());
  track('close-plugin', undefined, { durationInS });
});

let alreadyToasted = false;

export const App: FC = memo(function App() {
  const dispatch = useAppDispatch();
  useEffect(() => {
    let checkSession = async () => {
      try {
        const res = await checkSessionLight();

        track('open-plugin');
        dispatch(setStripeData(res));
      } catch (e: any) {
        if (isAuthError(e)) {
          dispatchOther(setSignedInState(false));
        } else {
          handleError(e);
          if (!env.isDev || !alreadyToasted) {
            // In development, because of strict mode, we add a guard to ensure it toasts only once.
            alreadyToasted = true;
            toastError(e);
          }
          // There is at least one case like "invalid parameter" in the error that should trigger a logout, but I don't know how to reproduce.
          // When codes are identified, they should be used here as a condition to trigger a logout.
          // logout(true);
          dispatch(setAuthError(e));
        }
      }
    };
    checkSession();
  }, [dispatch]);
  // We can import 'react-toastify/dist/ReactToastify.minimal.css'
  // instead, but we would need to re-add animations & co to make it work.
  return (
    <ThemeProvider theme={theme}>
      <div className={classes.root}>
        <Layout />
        <ToastContainer
          position='top-center'
          autoClose={false}
          hideProgressBar={true}
          newestOnTop={true}
          closeOnClick={false}
          draggable={false}
          className={classes.toasters}
          toastClassName={alertClasses.root}
        />
      </div>
    </ThemeProvider>
  );
});
