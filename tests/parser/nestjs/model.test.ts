import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { extractModels } from '../../../src/parser/nestjs/model';

const fixture = (file: string) => {
  const filePath = path.join(__dirname, '../fixtures/simple-app', file);
  return { filePath, source: fs.readFileSync(filePath, 'utf8') };
};

describe('extractModels', () => {
  it('extracts the entity name', () => {
    const { filePath, source } = fixture('user.entity.ts');
    const [node] = extractModels(filePath, source);
    expect(node.name).toBe('User');
  });

  it('sets kind to model', () => {
    const { filePath, source } = fixture('user.entity.ts');
    const [node] = extractModels(filePath, source);
    expect(node.kind).toBe('model');
  });

  it('extracts related entity from OneToMany', () => {
    const { filePath, source } = fixture('user.entity.ts');
    const [node] = extractModels(filePath, source);
    expect(node.dependencies).toContain('Post');
  });

  it('extracts related entity from ManyToOne', () => {
    const { filePath, source } = fixture('post.entity.ts');
    const [node] = extractModels(filePath, source);
    expect(node.dependencies).toContain('User');
  });

  it('ignores non-relation decorators like @Column and @PrimaryGeneratedColumn', () => {
    const { filePath, source } = fixture('post.entity.ts');
    const [node] = extractModels(filePath, source);
    // Only ManyToOne relation — columns should not appear
    expect(node.dependencies).toHaveLength(1);
  });

  it('ignores classes without @Entity', () => {
    const { filePath, source } = fixture('plain.entity.ts');
    const result = extractModels(filePath, source);
    expect(result).toHaveLength(0);
  });

  it('returns empty array for a file with no classes', () => {
    const result = extractModels('fake.ts', `export const x = 1;`);
    expect(result).toHaveLength(0);
  });

  it('records the correct source file path', () => {
    const { filePath, source } = fixture('user.entity.ts');
    const [node] = extractModels(filePath, source);
    expect(node.filePath).toContain('user.entity.ts');
  });

  it('records a line number greater than zero', () => {
    const { filePath, source } = fixture('user.entity.ts');
    const [node] = extractModels(filePath, source);
    expect(node.line).toBeGreaterThan(0);
  });
});
