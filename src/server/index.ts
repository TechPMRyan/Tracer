import express from 'express';
import { registerRoutes } from './routes';

export function startServer(port: number, dbPath: string): void {
  const app = express();

  app.use(express.json());
  app.use(express.static('src/ui'));

  registerRoutes(app, dbPath);

  app.listen(port, () => {
    console.log(`Tracer running at http://localhost:${port}`);
  });
}
