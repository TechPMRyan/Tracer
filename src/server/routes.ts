import * as path from 'path';
import { Express } from 'express';
import { loadGraph } from '../graph/storage';
import { Graph, GraphNode } from '../graph/types';

// Strips the absolute projectPath prefix from every node's filePath so that
// machine-specific paths (e.g. C:\Users\Ryan\...) are never sent to the client.
function relativiseGraph(graph: Graph): Graph {
  const base = graph.projectPath;
  return {
    ...graph,
    nodes: graph.nodes.map(node => ({
      ...node,
      filePath: path.relative(base, node.filePath).replace(/\\/g, '/'),
    })),
  };
}

export function registerRoutes(app: Express, dbPath: string): void {
  function getGraph(res: any): Graph | null {
    let graph: ReturnType<typeof loadGraph>;
    try {
      graph = loadGraph(dbPath);
    } catch {
      res.status(500).json({ error: 'Graph data is corrupt. Run tracer scan to rebuild.' });
      return null;
    }
    if (!graph) {
      res.status(404).json({ error: 'No graph found. Run tracer scan first.' });
      return null;
    }
    return graph;
  }

  app.get('/api/graph', (_req, res) => {
    const graph = getGraph(res);
    if (!graph) return;
    res.json(relativiseGraph(graph));
  });

  app.get('/api/node/:id', (req, res) => {
    const graph = getGraph(res);
    if (!graph) return;

    const node = graph.nodes.find(n => n.id === req.params.id);
    if (!node) {
      res.status(404).json({ error: 'Node not found.' });
      return;
    }

    const edges = graph.edges.filter(
      e => e.sourceId === node.id || e.targetId === node.id
    );

    const safeNode: GraphNode = {
      ...node,
      filePath: path.relative(graph.projectPath, node.filePath).replace(/\\/g, '/'),
    };

    res.json({ node: safeNode, edges });
  });
}
