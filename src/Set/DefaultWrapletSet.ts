import { WrapletSet, WrapletSetSymbol } from "./WrapletSet";
import { Wraplet } from "../types/Wraplet";
import { DefaultSearchableSet } from "./DefaultSearchableSet";
import { WrapletSetReadonlySymbol } from "./WrapletSetReadonly";

export class DefaultWrapletSet<T extends Wraplet>
  extends DefaultSearchableSet<T>
  implements WrapletSet
{
  [WrapletSetReadonlySymbol]: true = true;
  [WrapletSetSymbol]: true = true;
}
