// Edge case: a class without @Entity — should not be extracted
export class NotAnEntity {
  id: number;
  name: string;
}
