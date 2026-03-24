import { Graph } from './types';

// Reads and writes the graph to a local SQLite database
export function saveGraph(graph: Graph, dbPath: string): void {
  // TODO: persist graph nodes and edges via better-sqlite3
}

export function loadGraph(dbPath: string): Graph | null {
  // TODO: load graph from SQLite, return null if not found
  return null;
}
