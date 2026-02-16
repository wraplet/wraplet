import { ArgCreator, ArgCreatorSymbol } from "./types/ArgCreator";
import { WrapletDependencyMap } from "../Wraplet/types/WrapletDependencyMap";
import { WrapletCreatorArgs } from "./types/WrapletCreator";

export class DefaultArgCreator<
  N extends Node,
  M extends WrapletDependencyMap = WrapletDependencyMap,
> implements ArgCreator<N, M> {
  [ArgCreatorSymbol]: true = true;

  constructor(private creator: ArgCreator<N, M>["createArg"]) {}

  createArg(args: WrapletCreatorArgs<N, M>): unknown {
    return this.creator(args);
  }

  public static create<
    N extends Node,
    M extends WrapletDependencyMap = WrapletDependencyMap,
  >(creator: ArgCreator<N, M>["createArg"]): DefaultArgCreator<N, M> {
    return new DefaultArgCreator<N, M>(creator);
  }
}
