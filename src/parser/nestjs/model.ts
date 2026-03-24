import * as path from 'path';
import Parser from 'tree-sitter';
import TypeScript from 'tree-sitter-typescript';
import { ParsedNode } from '../types';

const parser = new Parser();
parser.setLanguage(TypeScript.typescript);

// Relation decorators that connect entities to other entities
const RELATION_DECORATORS = new Set([
  'ManyToOne',
  'OneToMany',
  'OneToOne',
  'ManyToMany',
]);

export function extractModels(
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

    if (!hasSiblingDecorator(exportNode, 'Entity')) continue;

    const className = classNode.childForFieldName('name')?.text ?? 'Unknown';

    nodes.push({
      id: `model:${className}`,
      kind: 'model',
      name: className,
      filePath: path.resolve(filePath),
      line: classNode.startPosition.row + 1,
      dependencies: extractRelations(classNode),
    });
  }

  return nodes;
}

// Extracts related entity names from relation decorators on class fields.
// Columns (@Column, @PrimaryGeneratedColumn) are ignored — not relevant to the graph.
function extractRelations(classNode: Parser.SyntaxNode): string[] {
  const relations: string[] = [];
  const body = classNode.namedChildren.find(n => n.type === 'class_body');
  if (!body) return relations;

  for (const field of body.namedChildren) {
    if (field.type !== 'public_field_definition') continue;

    for (const decorator of field.namedChildren) {
      if (decorator.type !== 'decorator') continue;

      const inner = decorator.namedChildren[0];
      if (!inner) continue;

      const name =
        inner.type === 'call_expression'
          ? inner.childForFieldName('function')?.text
          : inner.text;

      if (!name || !RELATION_DECORATORS.has(name)) continue;

      // Relation type is in the field's type annotation.
      // Scalar: user: User  -> type_identifier -> 'User'
      // Array:  posts: Post[] -> array_type -> type_identifier -> 'Post'
      const typeAnnotation = field.childForFieldName('type');
      const typeNode = typeAnnotation?.namedChildren[0];
      if (!typeNode) continue;

      const typeName =
        typeNode.type === 'array_type'
          ? typeNode.namedChildren[0]?.text
          : typeNode.text;

      if (typeName) relations.push(typeName);
    }
  }

  return [...new Set(relations)]; // deduplicate
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
