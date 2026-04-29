export type NodeInitializer<CONTEXT> = (
  node: Node,
  context?: CONTEXT,
) => Promise<void>;
