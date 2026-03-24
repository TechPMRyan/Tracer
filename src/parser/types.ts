export type NodeKind = 'controller' | 'service' | 'module' | 'model';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface ParsedRoute {
  method: HttpMethod;
  path: string;
}

export interface ParsedNode {
  id: string;
  kind: NodeKind;
  name: string;
  filePath: string;
  line: number;
  routes?: ParsedRoute[];       // controllers only
  dependencies?: string[];      // injected services
}
