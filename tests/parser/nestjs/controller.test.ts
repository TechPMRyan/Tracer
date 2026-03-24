import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { extractControllers } from '../../../src/parser/nestjs/controller';

const fixture = (file: string) => {
  const filePath = path.join(__dirname, '../fixtures/simple-app', file);
  return { filePath, source: fs.readFileSync(filePath, 'utf8') };
};

describe('extractControllers', () => {
  it('extracts the controller name', () => {
    const { filePath, source } = fixture('user.controller.ts');
    const result = extractControllers(filePath, source);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('UserController');
  });

  it('sets kind to controller', () => {
    const { filePath, source } = fixture('user.controller.ts');
    const [node] = extractControllers(filePath, source);
    expect(node.kind).toBe('controller');
  });

  it('extracts all HTTP routes', () => {
    const { filePath, source } = fixture('user.controller.ts');
    const [node] = extractControllers(filePath, source);
    expect(node.routes).toHaveLength(5);
  });

  it('builds full route paths from controller prefix and method path', () => {
    const { filePath, source } = fixture('user.controller.ts');
    const [node] = extractControllers(filePath, source);
    const paths = node.routes!.map(r => `${r.method} ${r.path}`);
    expect(paths).toContain('GET /users');
    expect(paths).toContain('GET /users/:id');
    expect(paths).toContain('POST /users');
    expect(paths).toContain('PUT /users/:id');
    expect(paths).toContain('DELETE /users/:id');
  });

  it('extracts nested route paths', () => {
    const { filePath, source } = fixture('auth.controller.ts');
    const [node] = extractControllers(filePath, source);
    const paths = node.routes!.map(r => `${r.method} ${r.path}`);
    expect(paths).toContain('POST /auth/login');
    expect(paths).toContain('POST /auth/register');
    expect(paths).toContain('GET /auth/profile');
  });

  it('extracts injected service dependencies', () => {
    const { filePath, source } = fixture('user.controller.ts');
    const [node] = extractControllers(filePath, source);
    expect(node.dependencies).toContain('UserService');
  });

  it('returns empty routes for a controller with no methods', () => {
    const { filePath, source } = fixture('empty.controller.ts');
    const [node] = extractControllers(filePath, source);
    expect(node.routes).toHaveLength(0);
  });

  it('returns empty array for a file with no controllers', () => {
    const result = extractControllers('fake.ts', `export const x = 1;`);
    expect(result).toHaveLength(0);
  });

  it('records the correct source file path', () => {
    const { filePath, source } = fixture('user.controller.ts');
    const [node] = extractControllers(filePath, source);
    expect(node.filePath).toContain('user.controller.ts');
  });

  it('records a line number greater than zero', () => {
    const { filePath, source } = fixture('user.controller.ts');
    const [node] = extractControllers(filePath, source);
    expect(node.line).toBeGreaterThan(0);
  });
});
