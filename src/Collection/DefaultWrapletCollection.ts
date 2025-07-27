import { WrapletCollectionSymbol } from "./WrapletCollection";
import { DefaultWrapletCollectionReadonly } from "./DefaultWrapletCollectionReadonly";
import { Wraplet } from "../types/Wraplet";
import { Collection } from "./Collection";

export class DefaultWrapletCollection
  extends DefaultWrapletCollectionReadonly
  implements Collection<Wraplet>
{
  public [WrapletCollectionSymbol]: true = true;

  public add(item: Wraplet): void {
    this.items.add(item);
  }

  public delete(item: Wraplet): void {
    this.items.delete(item);
  }
}
