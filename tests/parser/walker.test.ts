import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { walkTypeScriptFiles } from '../../src/parser';

let tmpDir: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'tracer-walker-test-'));
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

function write(relPath: string, content = '') {
  const full = path.join(tmpDir, relPath);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, content, 'utf8');
  return full;
}

describe('walkTypeScriptFiles', () => {
  it('returns .ts files in a flat directory', () => {
    write('a.ts');
    write('b.ts');
    const files = walkTypeScriptFiles(tmpDir);
    expect(files).toHaveLength(2);
  });

  it('recurses into subdirectories', () => {
    write('src/a.ts');
    write('src/nested/b.ts');
    const files = walkTypeScriptFiles(tmpDir);
    expect(files).toHaveLength(2);
  });

  it('excludes .d.ts declaration files', () => {
    write('types.d.ts');
    write('real.ts');
    const files = walkTypeScriptFiles(tmpDir);
    expect(files).toHaveLength(1);
    expect(files[0]).toMatch(/real\.ts$/);
  });

  it('skips node_modules', () => {
    write('src/app.ts');
    write('node_modules/lib/index.ts');
    const files = walkTypeScriptFiles(tmpDir);
    expect(files).toHaveLength(1);
    expect(files[0]).toMatch(/app\.ts$/);
  });

  it('skips dist', () => {
    write('src/app.ts');
    write('dist/app.js.ts');
    const files = walkTypeScriptFiles(tmpDir);
    expect(files).toHaveLength(1);
    expect(files[0]).toMatch(/app\.ts$/);
  });

  it('skips build', () => {
    write('src/app.ts');
    write('build/app.ts');
    const files = walkTypeScriptFiles(tmpDir);
    expect(files).toHaveLength(1);
  });

  it('ignores non-.ts files', () => {
    write('app.ts');
    write('app.js');
    write('readme.md');
    write('styles.css');
    const files = walkTypeScriptFiles(tmpDir);
    expect(files).toHaveLength(1);
    expect(files[0]).toMatch(/app\.ts$/);
  });

  it('returns an empty array for an empty directory', () => {
    const files = walkTypeScriptFiles(tmpDir);
    expect(files).toHaveLength(0);
  });

  it('returns an empty array for a nonexistent path', () => {
    const files = walkTypeScriptFiles(path.join(tmpDir, 'does-not-exist'));
    expect(files).toHaveLength(0);
  });

  it('returns absolute paths', () => {
    write('src/app.ts');
    const files = walkTypeScriptFiles(tmpDir);
    expect(path.isAbsolute(files[0])).toBe(true);
  });
});
