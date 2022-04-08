const { WebSocketServer } = require('ws');

const showDebugLogs = true;

const port = 9001;
//initialize the WebSocket server instance
const wss = new WebSocketServer({ port });
wss.on('connection', ws => {
  ws.isAlive = true;
  ws.on('pong', () => {
    ws.isAlive = true;
  });

  //connection is up, let's add a simple simple event
  ws.on('message', message => {
    //send back the message to the other clients
    wss.clients.forEach(client => {
      if (client != ws) {
        if (showDebugLogs) {
          const obj = JSON.parse(message.toString());
          if (obj.error) {
            console.log(
              obj.__source === 'browser' ? 'Request' : 'Response',
              obj.type,
              obj.__id,
              'from',
              obj.__source,
              '- error:',
              obj.error,
              '- has payload:',
              !!obj.payload,
            );
          } else {
            console.log(
              obj.__source === 'browser' ? 'Request' : 'Response',
              obj.type,
              obj.__id,
              'from',
              obj.__source,
              '- has payload:',
              !!obj.payload,
            );
          }
        }
        client.send(message);
      }
    });
  });
});

const interval = setInterval(() => {
  wss.clients.forEach(ws => {
    if (!ws.isAlive) return ws.terminate();
    ws.isAlive = false;
    ws.ping();
  });
}, 30000);

wss.on('close', () => {
  console.log('Closing websocket server.');
  clearInterval(interval);
});

['exit', 'SIGINT', 'SIGUSR1', 'SIGUSR2', 'SIGTERM', 'SIGQUIT', 'uncaughtException'].forEach(signal =>
  process.on(signal, () => {
    wss.close();
    process.exit();
  }),
);
