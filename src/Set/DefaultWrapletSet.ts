import { WrapletSet, WrapletSetSymbol } from "./types/WrapletSet";
import { Wraplet } from "../Wraplet/types/Wraplet";
import { DefaultSearchableSet } from "./DefaultSearchableSet";
import {
  WrapletSetReadonly,
  WrapletSetReadonlySymbol,
} from "./types/WrapletSetReadonly";

export class DefaultWrapletSet<T extends Wraplet>
  extends DefaultSearchableSet<T>
  implements WrapletSet<T>, WrapletSetReadonly<T>
{
  [WrapletSetReadonlySymbol]: true = true;
  [WrapletSetSymbol]: true = true;
}
