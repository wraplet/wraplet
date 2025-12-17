import { Wraplet } from "../Wraplet/types/Wraplet";
import {
  WrapletSetReadonly,
  WrapletSetReadonlySymbol,
} from "./types/WrapletSetReadonly";
import { DefaultSearchableSet } from "./DefaultSearchableSet";

export class DefaultWrapletSetReadonly<T extends Wraplet>
  extends DefaultSearchableSet<T>
  implements WrapletSetReadonly
{
  [WrapletSetReadonlySymbol]: true = true;
}
