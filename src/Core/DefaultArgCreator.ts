import { ArgCreator, ArgCreatorSymbol } from "./types/ArgCreator";
import { WrapletChildrenMap } from "./types/WrapletChildrenMap";
import { WrapletCreatorArgs } from "./types/WrapletCreator";

export class DefaultArgCreator<
  N extends Node,
  M extends WrapletChildrenMap = WrapletChildrenMap,
> implements ArgCreator<N, M> {
  [ArgCreatorSymbol]: true = true;

  constructor(private creator: ArgCreator<N, M>["createArg"]) {}

  createArg(args: WrapletCreatorArgs<N, M>): unknown {
    return this.creator(args);
  }

  public static create<
    N extends Node,
    M extends WrapletChildrenMap = WrapletChildrenMap,
  >(creator: ArgCreator<N, M>["createArg"]): DefaultArgCreator<N, M> {
    return new DefaultArgCreator<N, M>(creator);
  }
}
