# Tracer — Roadmap

## v1 — Foundation
**Target:** TypeScript / NestJS

- [ ] CLI: `tracer scan` and `tracer serve`
- [ ] Parser: NestJS controllers, services, modules, models
- [ ] Graph: node + edge construction, SQLite storage
- [ ] UI: browser-based Cytoscape.js rendering
- [ ] Core interactions: pan, zoom, click-to-inspect
- [ ] Hotspot detection: flag highly-connected nodes

## v2 — Depth & Distribution
**Target:** TypeScript / Express + VS Code Extension

- [ ] Parser: Express route and middleware extraction
- [ ] VS Code extension: render graph in editor panel
- [ ] Click node → jump to source file
- [ ] Impact analysis: highlight blast radius from selected node
- [ ] Static HTML export: shareable snapshots

## v3 — Cross-Language
**Target:** Python / FastAPI

- [ ] Parser: FastAPI routes, dependencies, models
- [ ] Multi-language graph: connect services across language boundaries
- [ ] CI/CD integration: graph diff on pull request

## v4 — Scale & Intelligence
**Target:** Go / Gin, Fiber

- [ ] Go parser
- [ ] Monorepo support: workspace-aware scanning
- [ ] AI-assisted impact prediction
- [ ] Natural language queries: "show me everything that touches payments"
