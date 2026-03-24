import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { extractServices } from '../../../src/parser/nestjs/service';

const fixture = (file: string) => {
  const filePath = path.join(__dirname, '../fixtures/simple-app', file);
  return { filePath, source: fs.readFileSync(filePath, 'utf8') };
};

describe('extractServices', () => {
  it('extracts the service name', () => {
    const { filePath, source } = fixture('user.service.ts');
    const [node] = extractServices(filePath, source);
    expect(node.name).toBe('UserService');
  });

  it('sets kind to service', () => {
    const { filePath, source } = fixture('user.service.ts');
    const [node] = extractServices(filePath, source);
    expect(node.kind).toBe('service');
  });

  it('extracts a single injected dependency', () => {
    const { filePath, source } = fixture('user.service.ts');
    const [node] = extractServices(filePath, source);
    expect(node.dependencies).toContain('UserRepository');
    expect(node.dependencies).toHaveLength(1);
  });

  it('extracts multiple injected dependencies', () => {
    const { filePath, source } = fixture('auth.service.ts');
    const [node] = extractServices(filePath, source);
    expect(node.dependencies).toContain('UserService');
    expect(node.dependencies).toContain('TokenService');
    expect(node.dependencies).toHaveLength(2);
  });

  it('ignores classes without @Injectable', () => {
    const { filePath, source } = fixture('plain.service.ts');
    const result = extractServices(filePath, source);
    expect(result).toHaveLength(0);
  });

  it('returns empty array for a file with no classes', () => {
    const result = extractServices('fake.ts', `export const x = 1;`);
    expect(result).toHaveLength(0);
  });

  it('records the correct source file path', () => {
    const { filePath, source } = fixture('user.service.ts');
    const [node] = extractServices(filePath, source);
    expect(node.filePath).toContain('user.service.ts');
  });

  it('records a line number greater than zero', () => {
    const { filePath, source } = fixture('user.service.ts');
    const [node] = extractServices(filePath, source);
    expect(node.line).toBeGreaterThan(0);
  });
});
