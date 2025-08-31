import { Wraplet } from "../types/Wraplet";
import {
  WrapletSetReadonly,
  WrapletSetReadonlySymbol,
} from "../types/Set/WrapletSetReadonly";
import { DefaultSearchableSet } from "./DefaultSearchableSet";

export class DefaultWrapletSetReadonly<T extends Wraplet>
  extends DefaultSearchableSet<T>
  implements WrapletSetReadonly
{
  [WrapletSetReadonlySymbol]: true = true;
}
