import { NodeKind } from '../parser/types';

export interface GraphNode {
  id: string;
  kind: NodeKind;
  name: string;
  filePath: string;
  line: number;
  connectionCount: number;   // computed — used for hotspot detection
}

export interface GraphEdge {
  id: string;
  sourceId: string;
  targetId: string;
  label: string;             // e.g. 'calls', 'imports', 'declares'
}

export interface Graph {
  nodes: GraphNode[];
  edges: GraphEdge[];
  scannedAt: string;         // ISO timestamp
  projectPath: string;
}
