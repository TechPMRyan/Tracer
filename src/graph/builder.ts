import { ParsedNode } from '../parser/types';
import { Graph, GraphNode, GraphEdge } from './types';

export function buildGraph(nodes: ParsedNode[], projectPath: string): Graph {
  const graphNodes = buildNodes(nodes);
  const nameIndex = buildNameIndex(graphNodes);
  const graphEdges = buildEdges(nodes, nameIndex);
  const withCounts = applyConnectionCounts(graphNodes, graphEdges);

  return {
    nodes: withCounts,
    edges: graphEdges,
    scannedAt: new Date().toISOString(),
    projectPath,
  };
}

function buildNodes(parsed: ParsedNode[]): GraphNode[] {
  return parsed.map(p => ({
    id: p.id,
    kind: p.kind,
    name: p.name,
    filePath: p.filePath,
    line: p.line,
    connectionCount: 0,
    ...(p.routes?.length ? { routes: p.routes } : {}),
  }));
}

// Maps class name -> node id for dependency resolution.
// e.g. 'UserService' -> 'service:UserService'
function buildNameIndex(nodes: GraphNode[]): Map<string, string> {
  const index = new Map<string, string>();
  for (const node of nodes) {
    index.set(node.name, node.id);
  }
  return index;
}

function buildEdges(
  parsed: ParsedNode[],
  nameIndex: Map<string, string>
): GraphEdge[] {
  const edges: GraphEdge[] = [];
  const seen = new Set<string>();

  for (const node of parsed) {
    if (!node.dependencies?.length) continue;

    for (const depName of node.dependencies) {
      const targetId = nameIndex.get(depName);
      if (!targetId) continue; // dependency not found in this scan — skip

      const edgeId = `${node.id}->${targetId}`;
      if (seen.has(edgeId)) continue; // no duplicate edges
      seen.add(edgeId);

      edges.push({
        id: edgeId,
        sourceId: node.id,
        targetId,
        label: edgeLabel(node.id, targetId),
      });
    }
  }

  return edges;
}

// Computes connection count for each node (in + out degree).
// Nodes with high counts are hotspots.
function applyConnectionCounts(
  nodes: GraphNode[],
  edges: GraphEdge[]
): GraphNode[] {
  const counts = new Map<string, number>();

  for (const edge of edges) {
    counts.set(edge.sourceId, (counts.get(edge.sourceId) ?? 0) + 1);
    counts.set(edge.targetId, (counts.get(edge.targetId) ?? 0) + 1);
  }

  return nodes.map(node => ({
    ...node,
    connectionCount: counts.get(node.id) ?? 0,
  }));
}

// Returns a human-readable edge label based on the kinds of source and target.
function edgeLabel(sourceId: string, targetId: string): string {
  const sourceKind = sourceId.split(':')[0];
  const targetKind = targetId.split(':')[0];

  if (sourceKind === 'module') return 'declares';
  if (sourceKind === 'controller' && targetKind === 'service') return 'calls';
  if (sourceKind === 'service' && targetKind === 'service') return 'calls';
  if (sourceKind === 'model' && targetKind === 'model') return 'relates to';
  return 'depends on';
}
