import { Wraplet } from "../../Wraplet/types/Wraplet";
import { MapWrapper } from "../../Map/MapWrapper";
import { WrapletDependencyMap } from "../../Wraplet/types/WrapletDependencyMap";
import { CoreInitOptions } from "./CoreInitOptions";
import { Constructable } from "../../utils/types/Utils";
import { Core } from "./Core";

export type WrapletCreator<N extends Node, M extends WrapletDependencyMap> = (
  args: WrapletCreatorArgs<N, M>,
  currentCoreClass: Constructable<Core>,
) => Wraplet<N>;

export type WrapletCreatorArgs<
  N extends Node,
  M extends WrapletDependencyMap,
> = {
  id: keyof M;
  Class: Constructable<Wraplet<N>>;
  element: N;
  map: MapWrapper<M>;
  initOptions: CoreInitOptions<M>;
  args: unknown[];
};
