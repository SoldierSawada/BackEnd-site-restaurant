import 'reflect-metadata';
import { createServer } from 'http';
import express from 'express';
import { setup } from './config/SetUp';

const port = process.env.PORT ? Number(process.env.PORT) : 3000;

const app = express();
const server = createServer(app);

(async () => {
  await setup(app, server);

  server.listen(port, () => {
    console.log(
      `[ ready ] Restaurant API sur http://localhost:${port}/restaurant`,
    );
  });
})();
