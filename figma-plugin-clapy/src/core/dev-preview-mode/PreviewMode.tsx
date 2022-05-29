import { FC, memo, MutableRefObject, useEffect, useRef, useState } from 'react';

import styles from './PreviewMode.module.css';

type WSRef = MutableRefObject<WebSocket | undefined>;

const previewEnv = process.env.PREVIEW_ENV;
console.log('previewEnv:', previewEnv);
const isPreviewInBrowser = previewEnv === 'browser';
const isPreviewInFigma = previewEnv === 'figma';

export let wsReady = false;

/**
 * Allow to render the figma plugin in the browser and maintain the communiation with the plugin back-end through a websocket dev server.
 * Ensure:
 * - the websocket server is started,
 * - the plugin is open in Figma,
 * - the plugin react app is open in the browser.
 * In the project template, `yarn start` does everything.
 *
 * @example Wrap the app in index.tsx
 * ```ts
 * render(
 *   <PreviewMode>
 *     <App />
 *   </PreviewMode>
 *   , document.getElementById('react-page'));
 * ```
 */
export const PreviewMode: FC = memo(function PreviewMode({ children }) {
  const [isConnected, setIsConnected] = useState(false);
  const ws = useRef<WebSocket>();

  useEffect(() => {
    if (previewEnv) {
      const closeWebsocket = startWebSocket(ws, setIsConnected);
      const stopListeningMsg = listenToPluginBackMessage(ws);
      return () => {
        closeWebsocket();
        stopListeningMsg();
      };
    }
  }, []);

  if (!previewEnv) return <>{children}</>;

  return (
    <div className={styles.previewApp}>
      <h3>Preview App</h3>
      <div className={styles.previewConnectionInfo}>
        <strong>Connection Status:</strong>
        <div className={`${styles.previewConnectionStatus} ${isConnected ? styles.statusGreen : ''}`} />
      </div>

      {isPreviewInBrowser && setIsConnected && <div className={styles.previewPluginWrapper}>{children}</div>}
    </div>
  );
});

// Call this method only once, when the component is mounted.
function listenToPluginBackMessage(ws: WSRef) {
  const aborter = new AbortController();
  window.addEventListener('message', msg => onMsgReceivedInFigma(ws, msg), { signal: aborter.signal });
  return () => aborter.abort();
}

function onMsgReceivedInFigma(ws: WSRef, msg: MessageEvent) {
  const { pluginMessage, __source } = msg.data;
  if (!pluginMessage) return;
  if (isPreviewInBrowser && __source === 'figma') return;

  if (ws.current?.readyState === 1) {
    const message = JSON.stringify({
      ...msg.data.pluginMessage,
      __source: previewEnv,
    });
    ws.current.send(message);
  } else {
    setTimeout(() => onMsgReceivedInFigma(ws, msg), 1000);
  }
}

function startWebSocket(ws: WSRef, setIsConnected: (connected: boolean) => void) {
  let isComponentMounted = true;

  ws.current = new WebSocket('ws://localhost:9001/ws');
  ws.current.onopen = () => {
    setIsConnected(true);
    wsReady = true;
  };
  ws.current.onclose = () => {
    setIsConnected(false);
    wsReady = false;

    setTimeout(() => {
      if (isComponentMounted) {
        startWebSocket(ws, setIsConnected);
      }
    }, 3000);
  };

  ws.current.onmessage = async event => {
    try {
      const data = event.data instanceof Blob ? await event.data.text() : event.data;
      const { __source, ...msg } = JSON.parse(data);

      if (__source === 'figma' && !isPreviewInBrowser) {
        console.warn('Source is figma, but we are not in browser! Something is wrong.');
        return;
      }
      if (__source === 'browser' && !isPreviewInFigma) {
        console.warn('Source is browser, but we are not in figma! Something is wrong.');
        return;
      }

      if (isPreviewInBrowser) {
        // console.log('PreviewMode transfers Figma response to front');
        window.postMessage({ pluginMessage: msg, __source }, '*');
      } else if (isPreviewInFigma) {
        // console.log('PreviewMode transfers front request to Figma');
        window.parent.postMessage({ pluginMessage: msg }, '*');
      }
    } catch (err) {
      console.error('not a valid message', err);
    }
  };

  return () => {
    isComponentMounted = false;
    ws.current?.close();
  };
}
