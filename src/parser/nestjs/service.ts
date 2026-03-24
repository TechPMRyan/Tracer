import { ParsedNode } from '../types';

// Extracts @Injectable service classes and their constructor dependencies
export async function extractServices(filePath: string): Promise<ParsedNode[]> {
  // TODO: use tree-sitter to parse file and extract service metadata
  return [];
}
