import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { saveGraph, loadGraph } from '../../src/graph/storage';
import { Graph } from '../../src/graph/types';

const FIXTURE: Graph = {
  nodes: [
    { id: 'service:UserService', kind: 'service', name: 'UserService', filePath: '/app/user.service.ts', line: 4, connectionCount: 1 },
  ],
  edges: [],
  scannedAt: '2024-01-01T00:00:00.000Z',
  projectPath: '/app',
};

let tmpDir: string;
let dbPath: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'tracer-storage-test-'));
  dbPath = path.join(tmpDir, 'graph.db');
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe('saveGraph', () => {
  it('writes a JSON file next to the .db path', () => {
    saveGraph(FIXTURE, dbPath);
    const jsonPath = dbPath.replace(/\.db$/, '.json');
    expect(fs.existsSync(jsonPath)).toBe(true);
  });

  it('serialises all graph fields correctly', () => {
    saveGraph(FIXTURE, dbPath);
    const jsonPath = dbPath.replace(/\.db$/, '.json');
    const parsed = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    expect(parsed.projectPath).toBe('/app');
    expect(parsed.nodes).toHaveLength(1);
    expect(parsed.nodes[0].id).toBe('service:UserService');
  });

  it('overwrites an existing file on subsequent saves', () => {
    saveGraph(FIXTURE, dbPath);
    const updated: Graph = { ...FIXTURE, projectPath: '/updated' };
    saveGraph(updated, dbPath);
    const jsonPath = dbPath.replace(/\.db$/, '.json');
    const parsed = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    expect(parsed.projectPath).toBe('/updated');
  });
});

describe('loadGraph', () => {
  it('returns null when the JSON file does not exist', () => {
    const result = loadGraph(dbPath);
    expect(result).toBeNull();
  });

  it('returns the graph when a valid JSON file exists', () => {
    saveGraph(FIXTURE, dbPath);
    const result = loadGraph(dbPath);
    expect(result).not.toBeNull();
    expect(result!.projectPath).toBe('/app');
    expect(result!.nodes).toHaveLength(1);
  });

  it('round-trips all node fields', () => {
    saveGraph(FIXTURE, dbPath);
    const result = loadGraph(dbPath);
    const node = result!.nodes[0];
    expect(node.id).toBe('service:UserService');
    expect(node.kind).toBe('service');
    expect(node.name).toBe('UserService');
    expect(node.filePath).toBe('/app/user.service.ts');
    expect(node.line).toBe(4);
    expect(node.connectionCount).toBe(1);
  });

  it('throws on corrupt JSON — distinguishable from missing file', () => {
    const jsonPath = dbPath.replace(/\.db$/, '.json');
    fs.writeFileSync(jsonPath, '{ this is not valid json }', 'utf8');
    expect(() => loadGraph(dbPath)).toThrow();
  });

  it('returns null for a missing file, not an error', () => {
    // Explicitly confirm the missing-file case never throws
    expect(() => loadGraph(dbPath)).not.toThrow();
    expect(loadGraph(dbPath)).toBeNull();
  });
});
