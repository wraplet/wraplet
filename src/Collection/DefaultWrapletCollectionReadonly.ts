import { WrapletCollectionReadonlySymbol } from "./WrapletCollectionReadonly";
import { Wraplet } from "../types/Wraplet";
import { DefaultCollectionReadonly } from "./DefaultCollectionReadonly";

export class DefaultWrapletCollectionReadonly extends DefaultCollectionReadonly<Wraplet> {
  public [WrapletCollectionReadonlySymbol]: true = true;
}
