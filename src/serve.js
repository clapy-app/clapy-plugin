const express = require('express');
const morgan = require('morgan');

const app = express();
const port = 8081;

app.use(morgan('dev'));

app.use(express.static('./dist/app'));
app.use(express.static('.'));

const server = app.listen(port, () => console.log(`Server listening on port: ${port}`));

['SIGINT', 'SIGTERM', 'SIGQUIT'].forEach(signal => process.on(signal, () => {
  /** do your logic */
  server.close();
  process.exit();
}));