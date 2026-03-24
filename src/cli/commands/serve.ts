import { Command } from 'commander';

export const serveCommand = new Command('serve')
  .description('Start the local server and open the graph in your browser')
  .option('--port <port>', 'port to serve on', '2929')
  .action(async (options) => {
    // TODO: wire up server and open browser
    console.log(`Starting Tracer on http://localhost:${options.port}`);
  });
