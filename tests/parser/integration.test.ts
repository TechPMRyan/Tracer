import { describe, it, expect } from 'vitest';
import * as path from 'path';
import { parseProject } from '../../src/parser';
import { buildGraph } from '../../src/graph/builder';

const FIXTURE = path.resolve(__dirname, 'fixtures/simple-app');

describe('parseProject (simple-app fixture)', () => {
  it('extracts nodes from all supported kinds', async () => {
    const nodes = await parseProject(FIXTURE, { framework: 'nestjs' });
    const kinds = new Set(nodes.map(n => n.kind));
    expect(kinds).toContain('controller');
    expect(kinds).toContain('service');
    expect(kinds).toContain('module');
    expect(kinds).toContain('model');
  });

  it('extracts the expected number of nodes by kind', async () => {
    const nodes = await parseProject(FIXTURE, { framework: 'nestjs' });
    const byKind = (k: string) => nodes.filter(n => n.kind === k).length;
    expect(byKind('controller')).toBe(3);  // UserController, AuthController, EmptyController
    expect(byKind('service')).toBe(2);     // UserService, AuthService
    expect(byKind('module')).toBe(2);      // AppModule, UserModule
    expect(byKind('model')).toBe(2);       // User, Post
  });

  it('extracts specific known nodes', async () => {
    const nodes = await parseProject(FIXTURE, { framework: 'nestjs' });
    const names = new Set(nodes.map(n => n.name));
    expect(names).toContain('UserController');
    expect(names).toContain('UserService');
    expect(names).toContain('AppModule');
    expect(names).toContain('User');
    expect(names).toContain('Post');
  });

  it('does not extract plain classes (no NestJS decorator)', async () => {
    const nodes = await parseProject(FIXTURE, { framework: 'nestjs' });
    const names = new Set(nodes.map(n => n.name));
    expect(names).not.toContain('NotAnEntity');   // plain.entity.ts — no @Entity
    expect(names).not.toContain('PlainHelper');   // plain.service.ts — no @Injectable
  });

  it('attaches routes to controllers', async () => {
    const nodes = await parseProject(FIXTURE, { framework: 'nestjs' });
    const userCtrl = nodes.find(n => n.name === 'UserController');
    expect(userCtrl).toBeDefined();
    expect(userCtrl!.routes).toBeDefined();
    expect(userCtrl!.routes!.length).toBeGreaterThan(0);
  });

  it('UserController routes cover expected HTTP methods', async () => {
    const nodes = await parseProject(FIXTURE, { framework: 'nestjs' });
    const userCtrl = nodes.find(n => n.name === 'UserController')!;
    const methods = userCtrl.routes!.map(r => r.method);
    expect(methods).toContain('GET');
    expect(methods).toContain('POST');
    expect(methods).toContain('PUT');
    expect(methods).toContain('DELETE');
  });

  it('EmptyController has no routes', async () => {
    const nodes = await parseProject(FIXTURE, { framework: 'nestjs' });
    const empty = nodes.find(n => n.name === 'EmptyController')!;
    const routes = empty.routes ?? [];
    expect(routes).toHaveLength(0);
  });

  it('attaches file paths and line numbers to every node', async () => {
    const nodes = await parseProject(FIXTURE, { framework: 'nestjs' });
    for (const node of nodes) {
      expect(node.filePath).toBeTruthy();
      expect(node.line).toBeGreaterThan(0);
    }
  });

  it('produces no duplicate node IDs', async () => {
    const nodes = await parseProject(FIXTURE, { framework: 'nestjs' });
    const ids = nodes.map(n => n.id);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });

  it('all extracted nodes pass through buildGraph without error', async () => {
    const nodes = await parseProject(FIXTURE, { framework: 'nestjs' });
    const graph = buildGraph(nodes, FIXTURE);
    expect(graph.nodes).toHaveLength(nodes.length);
    expect(graph.edges.length).toBeGreaterThanOrEqual(0);
    expect(graph.projectPath).toBe(FIXTURE);
    expect(graph.scannedAt).toBeTruthy();
  });

  it('buildGraph produces edges between known pairs', async () => {
    const nodes = await parseProject(FIXTURE, { framework: 'nestjs' });
    const graph = buildGraph(nodes, FIXTURE);
    // AuthController depends on AuthService
    const edge = graph.edges.find(
      e => e.sourceId === 'controller:AuthController' && e.targetId === 'service:AuthService'
    );
    expect(edge).toBeDefined();
    expect(edge!.label).toBe('calls');
  });

  it('connection counts are non-negative for all nodes', async () => {
    const nodes = await parseProject(FIXTURE, { framework: 'nestjs' });
    const graph = buildGraph(nodes, FIXTURE);
    for (const node of graph.nodes) {
      expect(node.connectionCount).toBeGreaterThanOrEqual(0);
    }
  });
});
