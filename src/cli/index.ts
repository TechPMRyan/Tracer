#!/usr/bin/env node
import { Command } from 'commander';
import { scanCommand } from './commands/scan';
import { serveCommand } from './commands/serve';

const program = new Command();

program
  .name('tracer')
  .description('Visualize your codebase architecture. Trace every connection.')
  .version('0.1.0');

program.addCommand(scanCommand);
program.addCommand(serveCommand);

program.parse(process.argv);
