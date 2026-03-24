import { Graph } from '../graph/types';

export function renderGraph(graph: Graph): void {
  // TODO: initialize Cytoscape with graph data
  // Map nodes and edges, apply styles, bind click handlers
  console.log(`Rendering ${graph.nodes.length} nodes, ${graph.edges.length} edges`);
}
