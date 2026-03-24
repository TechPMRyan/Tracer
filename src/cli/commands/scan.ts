import { Command } from 'commander';
import * as path from 'path';
import { parseProject } from '../../parser';
import { buildGraph } from '../../graph/builder';
import { saveGraph } from '../../graph/storage';

export const scanCommand = new Command('scan')
  .description('Scan a codebase and build the architecture graph')
  .argument('<path>', 'path to the project root')
  .option('--framework <framework>', 'framework to target (nestjs)', 'nestjs')
  .option('--debug', 'show detailed parse output')
  .action(async (projectPath: string, options) => {
    const resolved = path.resolve(projectPath);
    console.log(`Scanning ${resolved}...`);

    const parsed = await parseProject(resolved, {
      framework: 'nestjs',
      debug: options.debug,
    });

    if (parsed.length === 0) {
      console.error('No nodes found. Is this a NestJS project?');
      process.exit(1);
    }

    const graph = buildGraph(parsed, resolved);
    const dbPath = path.join(resolved, '.tracer.db');
    saveGraph(graph, dbPath);

    console.log(`Found ${graph.nodes.length} nodes, ${graph.edges.length} edges`);
    console.log(`Graph saved. Run tracer serve to view.`);
  });
