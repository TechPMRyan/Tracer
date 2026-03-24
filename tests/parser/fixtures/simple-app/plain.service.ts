// Edge case: a class without @Injectable — should not be extracted
export class PlainHelper {
  doSomething() { return true; }
}
