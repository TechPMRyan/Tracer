import * as path from 'path';
import Parser from 'tree-sitter';
import TypeScript from 'tree-sitter-typescript';
import { ParsedNode } from '../types';

const parser = new Parser();
parser.setLanguage(TypeScript.typescript);

export function extractServices(
  filePath: string,
  source: string
): ParsedNode[] {
  const tree = parser.parse(source);
  const nodes: ParsedNode[] = [];

  for (const exportNode of findNodes(tree.rootNode, 'export_statement')) {
    const classNode = exportNode.namedChildren.find(
      n => n.type === 'class_declaration'
    );
    if (!classNode) continue;

    if (!hasSiblingDecorator(exportNode, 'Injectable')) continue;

    const className =
      classNode.childForFieldName('name')?.text ?? 'Unknown';

    nodes.push({
      id: `service:${className}`,
      kind: 'service',
      name: className,
      filePath: path.resolve(filePath),
      line: classNode.startPosition.row + 1,
      dependencies: extractDependencies(classNode),
    });
  }

  return nodes;
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
    if (!params) break;

    for (const param of params.namedChildren) {
      const typeNode = param.childForFieldName('type');
      const typeName = typeNode?.namedChildren[0]?.text;
      if (typeName) deps.push(typeName);
    }
    break;
  }

  return deps;
}

function hasSiblingDecorator(
  parent: Parser.SyntaxNode,
  decoratorName: string
): boolean {
  for (const child of parent.namedChildren) {
    if (child.type !== 'decorator') continue;
    const inner = child.namedChildren[0];
    if (!inner) continue;
    const name =
      inner.type === 'call_expression'
        ? inner.childForFieldName('function')?.text
        : inner.text;
    if (name === decoratorName) return true;
  }
  return false;
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
