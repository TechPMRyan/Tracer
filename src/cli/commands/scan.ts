import { Command } from 'commander';

export const scanCommand = new Command('scan')
  .description('Scan a codebase and build the architecture graph')
  .argument('<path>', 'path to the project root')
  .option('--framework <framework>', 'framework to target (nestjs)', 'nestjs')
  .option('--debug', 'show detailed parse output')
  .action(async (projectPath: string, options) => {
    // TODO: wire up parser and graph builder
    console.log(`Scanning ${projectPath} (${options.framework})...`);
  });
