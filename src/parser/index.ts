import * as fs from 'fs';
import * as path from 'path';
import { ParsedNode } from './types';
import { extractControllers } from './nestjs/controller';
import { extractServices } from './nestjs/service';
import { extractModules } from './nestjs/module';
import { extractModels } from './nestjs/model';

export interface ParserOptions {
  framework: 'nestjs';
  debug?: boolean;
}

export async function parseProject(
  projectPath: string,
  options: ParserOptions
): Promise<ParsedNode[]> {
  const files = walkTypeScriptFiles(projectPath);

  if (options.debug) {
    console.log(`Found ${files.length} TypeScript files`);
  }

  const allNodes: ParsedNode[] = [];

  for (const filePath of files) {
    const source = fs.readFileSync(filePath, 'utf8');

    try {
      allNodes.push(
        ...extractControllers(filePath, source),
        ...extractServices(filePath, source),
        ...extractModules(filePath, source),
        ...extractModels(filePath, source)
      );
    } catch (err) {
      // Loud failure — tell the user exactly which file failed and why
      const message = err instanceof Error ? err.message : String(err);
      console.error(`Parse error in ${filePath}: ${message}`);
    }
  }

  if (options.debug) {
    console.log(`Extracted ${allNodes.length} nodes`);
  }

  return allNodes;
}

// Recursively finds all .ts files, skipping node_modules and dist.
export function walkTypeScriptFiles(dir: string): string[] {
  const SKIP = new Set(['node_modules', 'dist', 'build', '.git']);
  const results: string[] = [];

  function walk(current: string): void {
    let entries: fs.Dirent[];

    try {
      entries = fs.readdirSync(current, { withFileTypes: true });
    } catch {
      console.error(`Cannot read directory: ${current}`);
      return;
    }

    for (const entry of entries) {
      if (SKIP.has(entry.name)) continue;

      const fullPath = path.join(current, entry.name);

      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (entry.isFile() && entry.name.endsWith('.ts') && !entry.name.endsWith('.d.ts')) {
        results.push(fullPath);
      }
    }
  }

  walk(dir);
  return results;
}
