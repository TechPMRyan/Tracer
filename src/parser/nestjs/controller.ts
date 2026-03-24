import * as path from 'path';
import Parser from 'tree-sitter';
import TypeScript from 'tree-sitter-typescript';
import { ParsedNode, ParsedRoute, HttpMethod } from '../types';

const parser = new Parser();
parser.setLanguage(TypeScript.typescript);

const HTTP_DECORATORS: Record<string, HttpMethod> = {
  Get: 'GET',
  Post: 'POST',
  Put: 'PUT',
  Patch: 'PATCH',
  Delete: 'DELETE',
};

export function extractControllers(
  filePath: string,
  source: string
): ParsedNode[] {
  const tree = parser.parse(source);
  const nodes: ParsedNode[] = [];

  // Controllers live inside export_statement nodes.
  // The @Controller decorator and the class_declaration are siblings within it.
  for (const exportNode of findNodes(tree.rootNode, 'export_statement')) {
    const classNode = exportNode.namedChildren.find(
      n => n.type === 'class_declaration'
    );
    if (!classNode) continue;

    const controllerPath = getSiblingDecoratorArg(exportNode, 'Controller');
    if (controllerPath === null) continue;

    const className =
      classNode.childForFieldName('name')?.text ?? 'Unknown';

    nodes.push({
      id: `controller:${className}`,
      kind: 'controller',
      name: className,
      filePath: path.resolve(filePath),
      line: classNode.startPosition.row + 1,
      routes: extractRoutes(classNode, controllerPath),
      dependencies: extractDependencies(classNode),
    });
  }

  return nodes;
}

// Route decorators and method_definition nodes are siblings inside class_body.
// Collect pending decorators as we walk children, then attach to the next method.
function extractRoutes(
  classNode: Parser.SyntaxNode,
  prefix: string
): ParsedRoute[] {
  const routes: ParsedRoute[] = [];
  const body = classNode.namedChildren.find(n => n.type === 'class_body');
  if (!body) return routes;

  let pendingDecorators: Parser.SyntaxNode[] = [];

  for (const child of body.namedChildren) {
    if (child.type === 'decorator') {
      pendingDecorators.push(child);
      continue;
    }

    if (child.type === 'method_definition') {
      for (const decorator of pendingDecorators) {
        const { name, arg } = readDecorator(decorator);
        const httpMethod = HTTP_DECORATORS[name];
        if (httpMethod) {
          routes.push({ method: httpMethod, path: joinPaths(prefix, arg) });
        }
      }
    }

    pendingDecorators = [];
  }

  return routes;
}

function extractDependencies(classNode: Parser.SyntaxNode): string[] {
  const deps: string[] = [];
  const body = classNode.namedChildren.find(n => n.type === 'class_body');
  if (!body) return deps;

  for (const method of body.namedChildren) {
    if (method.type !== 'method_definition') continue;
    if (method.childForFieldName('name')?.text !== 'constructor') continue;

    const params = method.namedChildren.find(
      n => n.type === 'formal_parameters'
    );
    if (!params) continue;

    for (const param of params.namedChildren) {
      const typeNode = param.childForFieldName('type');
      const typeName = typeNode?.namedChildren[0]?.text;
      if (typeName) deps.push(typeName);
    }
    break;
  }

  return deps;
}

// Reads the name and first string argument from a decorator node.
function readDecorator(decorator: Parser.SyntaxNode): {
  name: string;
  arg: string;
} {
  const inner = decorator.namedChildren[0];
  if (!inner) return { name: '', arg: '' };

  if (inner.type === 'call_expression') {
    const name = inner.childForFieldName('function')?.text ?? '';
    const args = inner.childForFieldName('arguments');
    const first = args?.namedChildren[0]?.text ?? '';
    const arg = first.replace(/^['"`]|['"`]$/g, '');
    return { name, arg };
  }

  return { name: inner.text, arg: '' };
}

// Looks at direct children of a parent node for a decorator with the given name.
function getSiblingDecoratorArg(
  parent: Parser.SyntaxNode,
  decoratorName: string
): string | null {
  for (const child of parent.namedChildren) {
    if (child.type !== 'decorator') continue;
    const { name, arg } = readDecorator(child);
    if (name === decoratorName) return arg;
  }
  return null;
}

function joinPaths(prefix: string, suffix: string): string {
  const a = prefix.replace(/\/$/, '');
  const b = suffix.replace(/^\//, '');
  if (!a && !b) return '/';
  if (!a) return `/${b}`;
  if (!b) return `/${a}`;
  return `/${a}/${b}`;
}

function* findNodes(
  node: Parser.SyntaxNode,
  type: string
): Generator<Parser.SyntaxNode> {
  if (node.type === type) yield node;
  for (const child of node.namedChildren) {
    yield* findNodes(child, type);
  }
}
