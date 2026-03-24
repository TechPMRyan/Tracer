import express from 'express';
import * as path from 'path';
import { registerRoutes } from './routes';

export function startServer(port: number, dbPath: string): void {
  const app = express();

  app.use(express.json());

  // Serve the UI
  app.use(express.static(path.join(__dirname, '../../src/ui')));

  registerRoutes(app, dbPath);

  app.listen(port, () => {
    console.log(`Tracer running at http://localhost:${port}`);
  });
}
