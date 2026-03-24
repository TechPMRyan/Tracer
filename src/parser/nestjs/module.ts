import * as path from 'path';
import Parser from 'tree-sitter';
import TypeScript from 'tree-sitter-typescript';
import { ParsedNode } from '../types';

const parser = new Parser();
parser.setLanguage(TypeScript.typescript);

export function extractModules(
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

    const moduleArgs = getModuleDecoratorObject(exportNode);
    if (!moduleArgs) continue;

    const className = classNode.childForFieldName('name')?.text ?? 'Unknown';

    nodes.push({
      id: `module:${className}`,
      kind: 'module',
      name: className,
      filePath: path.resolve(filePath),
      line: classNode.startPosition.row + 1,
      dependencies: [
        ...extractArrayItems(moduleArgs, 'controllers'),
        ...extractArrayItems(moduleArgs, 'providers'),
        ...extractArrayItems(moduleArgs, 'imports'),
      ],
    });
  }

  return nodes;
}

// Returns the object node inside @Module({...}), or null if not found.
function getModuleDecoratorObject(
  parent: Parser.SyntaxNode
): Parser.SyntaxNode | null {
  for (const child of parent.namedChildren) {
    if (child.type !== 'decorator') continue;

    const call = child.namedChildren[0];
    if (call?.type !== 'call_expression') continue;

    const name = call.childForFieldName('function')?.text;
    if (name !== 'Module') continue;

    const args = call.childForFieldName('arguments');
    return args?.namedChildren.find(n => n.type === 'object') ?? null;
  }
  return null;
}

// Extracts identifier names from a named array property in the @Module object.
// e.g. controllers: [UserController, AdminController] -> ['UserController', 'AdminController']
function extractArrayItems(
  objectNode: Parser.SyntaxNode,
  key: string
): string[] {
  for (const pair of objectNode.namedChildren) {
    if (pair.type !== 'pair') continue;
    if (pair.childForFieldName('key')?.text !== key) continue;

    const array = pair.childForFieldName('value');
    if (!array) continue;

    return array.namedChildren
      .filter(n => n.type === 'identifier')
      .map(n => n.text);
  }
  return [];
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
