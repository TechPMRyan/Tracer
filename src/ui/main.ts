import { renderGraph } from './renderer';

async function boot(): Promise<void> {
  const response = await fetch('/api/graph');

  if (!response.ok) {
    document.getElementById('status')!.textContent =
      'No graph found. Run tracer scan first.';
    return;
  }

  const graph = await response.json();
  renderGraph(graph);
}

boot();
