import { createServer, startServer } from './server.js';

createServer()
  .then(startServer)
  .catch((err) => {
    console.log(err);
  });
