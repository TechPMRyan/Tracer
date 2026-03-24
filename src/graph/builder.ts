import { ParsedNode } from '../parser/types';
import { Graph, GraphNode, GraphEdge } from './types';

export function buildGraph(nodes: ParsedNode[], projectPath: string): Graph {
  // TODO: convert ParsedNode[] into GraphNode[] + GraphEdge[]
  // Resolve dependencies, compute connection counts, detect hotspots
  return {
    nodes: [],
    edges: [],
    scannedAt: new Date().toISOString(),
    projectPath,
  };
}
