import { Collection, CollectionSymbol } from "./Collection";
import { DefaultCollectionReadonly } from "./DefaultCollectionReadonly";

export class DefaultCollection<T>
  extends DefaultCollectionReadonly<T>
  implements Collection<T>
{
  public [CollectionSymbol]: true = true;

  add(item: T): void {
    this.items.add(item);
  }

  delete(item: T): void {
    this.items.delete(item);
  }
}
