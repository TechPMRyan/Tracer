import * as fs from 'fs';
import { Graph } from './types';

export function saveGraph(graph: Graph, dbPath: string): void {
  const jsonPath = dbPath.replace(/\.db$/, '.json');
  fs.writeFileSync(jsonPath, JSON.stringify(graph, null, 2), 'utf8');
}

export function loadGraph(dbPath: string): Graph | null {
  const jsonPath = dbPath.replace(/\.db$/, '.json');
  if (!fs.existsSync(jsonPath)) return null;

  try {
    const raw = fs.readFileSync(jsonPath, 'utf8');
    return JSON.parse(raw) as Graph;
  } catch {
    return null;
  }
}
