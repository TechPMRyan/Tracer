import { ParsedNode } from '../types';

// Extracts TypeORM @Entity classes and their column/relation definitions
export async function extractModels(filePath: string): Promise<ParsedNode[]> {
  // TODO: use tree-sitter to parse file and extract entity metadata
  return [];
}
