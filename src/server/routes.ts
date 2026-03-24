import { Express } from 'express';
import { loadGraph } from '../graph/storage';

export function registerRoutes(app: Express, dbPath: string): void {
  // Returns the full graph payload
  app.get('/api/graph', (_req, res) => {
    const graph = loadGraph(dbPath);
    if (!graph) {
      res.status(404).json({ error: 'No graph found. Run tracer scan first.' });
      return;
    }
    res.json(graph);
  });

  // Returns a single node by ID
  app.get('/api/node/:id', (req, res) => {
    const graph = loadGraph(dbPath);
    if (!graph) {
      res.status(404).json({ error: 'No graph found. Run tracer scan first.' });
      return;
    }
    const node = graph.nodes.find(n => n.id === req.params.id);
    if (!node) {
      res.status(404).json({ error: `Node ${req.params.id} not found.` });
      return;
    }
    res.json(node);
  });
}
