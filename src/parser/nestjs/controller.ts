import { ParsedNode } from '../types';

// Extracts @Controller classes and their @Get/@Post/@Put/@Patch/@Delete routes
export async function extractControllers(filePath: string): Promise<ParsedNode[]> {
  // TODO: use tree-sitter to parse file and extract controller metadata
  return [];
}
