import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { extractModules } from '../../../src/parser/nestjs/module';

const fixture = (file: string) => {
  const filePath = path.join(__dirname, '../fixtures/simple-app', file);
  return { filePath, source: fs.readFileSync(filePath, 'utf8') };
};

describe('extractModules', () => {
  it('extracts the module name', () => {
    const { filePath, source } = fixture('user.module.ts');
    const [node] = extractModules(filePath, source);
    expect(node.name).toBe('UserModule');
  });

  it('sets kind to module', () => {
    const { filePath, source } = fixture('user.module.ts');
    const [node] = extractModules(filePath, source);
    expect(node.kind).toBe('module');
  });

  it('extracts controllers from the module', () => {
    const { filePath, source } = fixture('user.module.ts');
    const [node] = extractModules(filePath, source);
    expect(node.dependencies).toContain('UserController');
  });

  it('extracts providers from the module', () => {
    const { filePath, source } = fixture('user.module.ts');
    const [node] = extractModules(filePath, source);
    expect(node.dependencies).toContain('UserService');
  });

  it('extracts imported modules', () => {
    const { filePath, source } = fixture('app.module.ts');
    const [node] = extractModules(filePath, source);
    expect(node.dependencies).toContain('UserModule');
    expect(node.dependencies).toContain('AuthModule');
  });

  it('ignores classes without @Module', () => {
    const result = extractModules('fake.ts', `export class SomeClass {}`);
    expect(result).toHaveLength(0);
  });

  it('returns empty array for a file with no classes', () => {
    const result = extractModules('fake.ts', `export const x = 1;`);
    expect(result).toHaveLength(0);
  });

  it('records the correct source file path', () => {
    const { filePath, source } = fixture('user.module.ts');
    const [node] = extractModules(filePath, source);
    expect(node.filePath).toContain('user.module.ts');
  });

  it('records a line number greater than zero', () => {
    const { filePath, source } = fixture('user.module.ts');
    const [node] = extractModules(filePath, source);
    expect(node.line).toBeGreaterThan(0);
  });
});
