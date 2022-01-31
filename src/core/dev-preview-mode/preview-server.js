const { WebSocketServer } = require('ws');

const port = 9001;

//initialize the WebSocket server instance
const wss = new WebSocketServer({ port });
wss.on('connection', (ws) => {
  ws.isAlive = true;
  ws.on('pong', () => {
    ws.isAlive = true;
  });

  //connection is up, let's add a simple simple event
  ws.on('message', (message) => {
    //send back the message to the other clients
    wss.clients.forEach(client => {
      if (client != ws) {
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

wss.on('close', () => clearInterval(interval));

['exit', 'SIGINT', 'SIGUSR1', 'SIGUSR2', 'SIGTERM', 'SIGQUIT', 'uncaughtException'].forEach(signal => process.on(signal, () => {
  wss.close();
  process.exit();
}));
