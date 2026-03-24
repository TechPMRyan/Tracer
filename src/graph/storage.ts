import Database from 'better-sqlite3';
import { Graph, GraphNode, GraphEdge } from './types';

export function saveGraph(graph: Graph, dbPath: string): void {
  const db = new Database(dbPath);

  db.exec(`
    CREATE TABLE IF NOT EXISTS meta (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS nodes (
      id TEXT PRIMARY KEY,
      kind TEXT NOT NULL,
      name TEXT NOT NULL,
      filePath TEXT NOT NULL,
      line INTEGER NOT NULL,
      connectionCount INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS edges (
      id TEXT PRIMARY KEY,
      sourceId TEXT NOT NULL,
      targetId TEXT NOT NULL,
      label TEXT NOT NULL
    );
  `);

  // Clear existing data before writing — scan always produces a fresh graph
  db.exec(`DELETE FROM nodes; DELETE FROM edges; DELETE FROM meta;`);

  const insertNode = db.prepare(`
    INSERT INTO nodes (id, kind, name, filePath, line, connectionCount)
    VALUES (@id, @kind, @name, @filePath, @line, @connectionCount)
  `);

  const insertEdge = db.prepare(`
    INSERT INTO edges (id, sourceId, targetId, label)
    VALUES (@id, @sourceId, @targetId, @label)
  `);

  const insertMeta = db.prepare(`
    INSERT INTO meta (key, value) VALUES (@key, @value)
  `);

  const writeAll = db.transaction((g: Graph) => {
    for (const node of g.nodes) insertNode.run(node);
    for (const edge of g.edges) insertEdge.run(edge);
    insertMeta.run({ key: 'scannedAt', value: g.scannedAt });
    insertMeta.run({ key: 'projectPath', value: g.projectPath });
  });

  writeAll(graph);
  db.close();
}

export function loadGraph(dbPath: string): Graph | null {
  let db: Database.Database;

  try {
    db = new Database(dbPath, { readonly: true });
  } catch {
    return null;
  }

  try {
    const nodes = db.prepare(`SELECT * FROM nodes`).all() as GraphNode[];
    const edges = db.prepare(`SELECT * FROM edges`).all() as GraphEdge[];
    const meta = db.prepare(`SELECT key, value FROM meta`).all() as {
      key: string;
      value: string;
    }[];

    const metaMap = Object.fromEntries(meta.map(m => [m.key, m.value]));

    return {
      nodes,
      edges,
      scannedAt: metaMap['scannedAt'] ?? '',
      projectPath: metaMap['projectPath'] ?? '',
    };
  } catch {
    return null;
  } finally {
    db.close();
  }
}
