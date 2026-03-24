import { ParsedNode } from './types';

export interface ParserOptions {
  framework: 'nestjs';
  debug?: boolean;
}

export async function parseProject(
  projectPath: string,
  options: ParserOptions
): Promise<ParsedNode[]> {
  // TODO: walk files, dispatch to framework-specific extractors
  return [];
}
