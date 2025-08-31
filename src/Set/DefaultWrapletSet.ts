import { WrapletSet, WrapletSetSymbol } from "../types/Set/WrapletSet";
import { Wraplet } from "../types/Wraplet";
import { DefaultSearchableSet } from "./DefaultSearchableSet";
import { WrapletSetReadonlySymbol } from "../types/Set/WrapletSetReadonly";

export class DefaultWrapletSet<T extends Wraplet>
  extends DefaultSearchableSet<T>
  implements WrapletSet
{
  [WrapletSetReadonlySymbol]: true = true;
  [WrapletSetSymbol]: true = true;
}
