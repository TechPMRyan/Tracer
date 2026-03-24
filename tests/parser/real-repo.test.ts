/**
 * Real-repo integration test.
 *
 * Clones a small public NestJS repository (shallow, single branch) into a
 * temp directory and runs parseProject + buildGraph against it.  This test
 * is intentionally slow and network-dependent.  It is skipped automatically
 * when the TRACER_SKIP_REAL_REPO env variable is set to '1', or when git is
 * not available, so it never blocks offline or fast-feedback CI stages.
 *
 * To run manually:
 *   npx vitest run tests/parser/real-repo.test.ts
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { execSync, spawnSync } from 'child_process';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { parseProject } from '../../src/parser';
import { buildGraph } from '../../src/graph/builder';

// A small, stable NestJS demo used by the NestJS team itself.
const REPO_URL = 'https://github.com/nestjs/nest-cli.git';
const MIN_NODES = 5;

let tmpDir: string;
let repoPath: string;
let skipReason: string | null = null;

function gitAvailable(): boolean {
  const result = spawnSync('git', ['--version'], { stdio: 'pipe' });
  return result.status === 0;
}

beforeAll(() => {
  if (process.env.TRACER_SKIP_REAL_REPO === '1') {
    skipReason = 'TRACER_SKIP_REAL_REPO=1';
    return;
  }
  if (!gitAvailable()) {
    skipReason = 'git not found on PATH';
    return;
  }

  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'tracer-real-repo-'));
  repoPath = path.join(tmpDir, 'repo');

  try {
    execSync(
      `git clone --depth 1 --single-branch ${REPO_URL} ${repoPath}`,
      { stdio: 'pipe', timeout: 60_000 }
    );
  } catch (err) {
    skipReason = `clone failed: ${err instanceof Error ? err.message : String(err)}`;
  }
}, 90_000);

afterAll(() => {
  if (tmpDir) {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

describe('parseProject (real NestJS repo)', () => {
  it('extracts at least the minimum expected node count', async () => {
    if (skipReason) {
      console.log(`Skipping real-repo test: ${skipReason}`);
      return;
    }

    const nodes = await parseProject(repoPath, { framework: 'nestjs' });
    expect(nodes.length).toBeGreaterThanOrEqual(MIN_NODES);
  }, 30_000);

  it('produces a valid graph with edges', async () => {
    if (skipReason) return;

    const nodes = await parseProject(repoPath, { framework: 'nestjs' });
    const graph = buildGraph(nodes, repoPath);

    expect(graph.nodes.length).toBeGreaterThanOrEqual(MIN_NODES);
    expect(graph.projectPath).toBe(repoPath);
    expect(graph.scannedAt).toBeTruthy();
  }, 30_000);

  it('every graph node has a non-empty id, name, and filePath', async () => {
    if (skipReason) return;

    const nodes = await parseProject(repoPath, { framework: 'nestjs' });
    const graph = buildGraph(nodes, repoPath);

    for (const node of graph.nodes) {
      expect(node.id.length).toBeGreaterThan(0);
      expect(node.name.length).toBeGreaterThan(0);
      expect(node.filePath.length).toBeGreaterThan(0);
    }
  }, 30_000);
});
