import { Command } from 'commander';
import * as path from 'path';
import open from 'open';
import { startServer } from '../../server';

export const serveCommand = new Command('serve')
  .description('Start the local server and open the graph in your browser')
  .option('--port <port>', 'port to serve on', '2929')
  .option('--project <path>', 'path to the scanned project', '.')
  .action(async (options) => {
    const port = parseInt(options.port, 10);
    const projectPath = path.resolve(options.project);
    const dbPath = path.join(projectPath, '.tracer.db');

    startServer(port, dbPath);

    setTimeout(() => {
      open(`http://localhost:${port}`);
    }, 500);
  });
