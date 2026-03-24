import { ParsedNode } from '../types';

// Extracts @Module classes and their imports, providers, controllers
export async function extractModules(filePath: string): Promise<ParsedNode[]> {
  // TODO: use tree-sitter to parse file and extract module metadata
  return [];
}
