# Tracer — Architecture

## System Overview

```
CLI (commander.js)
  ├── scan command
  │     └── Parser (tree-sitter)
  │           └── NestJS extractors (controller, service, module, model)
  │                 └── Graph Builder
  │                       └── SQLite Storage
  └── serve command
        └── Local Server (Express)
              ├── GET /graph        → full graph payload
              └── GET /node/:id     → single node detail
                    └── Browser UI (Cytoscape.js)
```

## Modules

### CLI (`src/cli/`)
Entry point. Uses `commander.js` to register and dispatch commands.
- `scan` — triggers parsing pipeline on a target directory
- `serve` — starts local server and opens browser

### Parser (`src/parser/`)
Reads source files using `tree-sitter`. Language-specific extractors pull structured data from the AST.
- Input: file path
- Output: array of `ParsedNode` (typed)
- No code execution. Static analysis only.

### Graph (`src/graph/`)
Receives parsed output, constructs nodes and edges, persists to SQLite.
- `builder.ts` — connects parsed nodes into a graph structure
- `storage.ts` — reads/writes via `better-sqlite3`

### Server (`src/server/`)
Lightweight Express server. Serves the UI and exposes graph data as JSON.
- Spins up on `localhost:2929` by default
- Opens browser automatically on `tracer serve`

### UI (`src/ui/`)
Static frontend served by the local server.
- Cytoscape.js for graph rendering
- Fetches graph data from local API
- Pan, zoom, click-to-inspect

## Data Flow

```
Source file
  → tree-sitter AST
  → extractor (controller / service / module / model)
  → ParsedNode[]
  → GraphBuilder
  → Node[] + Edge[]
  → SQLite
  → GET /graph
  → Cytoscape.js
  → Browser
```

## Key Design Decisions

- Static analysis only — Tracer never executes code it finds
- Local SQLite before any cloud sync
- Deterministic output — same repo, same graph, always
- Every node traceable to a source file and line number
