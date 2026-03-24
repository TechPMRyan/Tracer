import { describe, it, expect } from 'vitest';
import { buildGraph } from '../../src/graph/builder';
import { ParsedNode } from '../../src/parser/types';

const nodes: ParsedNode[] = [
  {
    id: 'controller:UserController',
    kind: 'controller',
    name: 'UserController',
    filePath: '/app/user.controller.ts',
    line: 5,
    routes: [{ method: 'GET', path: '/users' }],
    dependencies: ['UserService'],
  },
  {
    id: 'service:UserService',
    kind: 'service',
    name: 'UserService',
    filePath: '/app/user.service.ts',
    line: 4,
    dependencies: ['UserRepository'],
  },
  {
    id: 'service:UserRepository',
    kind: 'service',
    name: 'UserRepository',
    filePath: '/app/user.repository.ts',
    line: 3,
    dependencies: [],
  },
  {
    id: 'model:User',
    kind: 'model',
    name: 'User',
    filePath: '/app/user.entity.ts',
    line: 4,
    dependencies: ['Post'],
  },
  {
    id: 'model:Post',
    kind: 'model',
    name: 'Post',
    filePath: '/app/post.entity.ts',
    line: 4,
    dependencies: [],
  },
];

describe('buildGraph', () => {
  it('creates a node for every parsed input', () => {
    const graph = buildGraph(nodes, '/app');
    expect(graph.nodes).toHaveLength(5);
  });

  it('creates an edge from controller to service', () => {
    const graph = buildGraph(nodes, '/app');
    const edge = graph.edges.find(
      e => e.sourceId === 'controller:UserController' && e.targetId === 'service:UserService'
    );
    expect(edge).toBeDefined();
    expect(edge?.label).toBe('calls');
  });

  it('creates an edge from service to repository', () => {
    const graph = buildGraph(nodes, '/app');
    const edge = graph.edges.find(
      e => e.sourceId === 'service:UserService' && e.targetId === 'service:UserRepository'
    );
    expect(edge).toBeDefined();
  });

  it('creates an edge between related models', () => {
    const graph = buildGraph(nodes, '/app');
    const edge = graph.edges.find(
      e => e.sourceId === 'model:User' && e.targetId === 'model:Post'
    );
    expect(edge).toBeDefined();
    expect(edge?.label).toBe('relates to');
  });

  it('does not create edges for unresolved dependencies', () => {
    const graph = buildGraph(nodes, '/app');
    // UserRepository has no dependencies — no phantom edges
    const edges = graph.edges.filter(
      e => e.sourceId === 'service:UserRepository'
    );
    expect(edges).toHaveLength(0);
  });

  it('does not create duplicate edges', () => {
    const duplicated: ParsedNode[] = [
      { ...nodes[0], dependencies: ['UserService', 'UserService'] },
      nodes[1],
    ];
    const graph = buildGraph(duplicated, '/app');
    const edges = graph.edges.filter(
      e => e.sourceId === 'controller:UserController' && e.targetId === 'service:UserService'
    );
    expect(edges).toHaveLength(1);
  });

  it('computes connection count for connected nodes', () => {
    const graph = buildGraph(nodes, '/app');
    const service = graph.nodes.find(n => n.id === 'service:UserService');
    expect(service?.connectionCount).toBeGreaterThan(0);
  });

  it('records zero connection count for isolated nodes', () => {
    const isolated: ParsedNode[] = [
      { id: 'service:Alone', kind: 'service', name: 'Alone', filePath: '/app/alone.ts', line: 1, dependencies: [] },
    ];
    const graph = buildGraph(isolated, '/app');
    expect(graph.nodes[0].connectionCount).toBe(0);
  });

  it('sets projectPath and scannedAt on the graph', () => {
    const graph = buildGraph(nodes, '/app');
    expect(graph.projectPath).toBe('/app');
    expect(graph.scannedAt).toBeTruthy();
  });

  it('returns an empty graph for zero input nodes', () => {
    const graph = buildGraph([], '/app');
    expect(graph.nodes).toHaveLength(0);
    expect(graph.edges).toHaveLength(0);
  });
});
