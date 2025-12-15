import { Wraplet } from "./Wraplet";
import { MapWrapper } from "../../Map/MapWrapper";
import { WrapletChildrenMap } from "./WrapletChildrenMap";
import { CoreInitOptions } from "./CoreInitOptions";
import { Constructable } from "../../utils/types/Utils";
import { Core } from "./Core";

export type WrapletCreator<N extends Node, M extends WrapletChildrenMap> = (
  args: WrapletCreatorArgs<N, M>,
  currentCoreClass: Constructable<Core>,
) => Wraplet<N>;

export type WrapletCreatorArgs<N extends Node, M extends WrapletChildrenMap> = {
  id: keyof M;
  Class: Constructable<Wraplet<N>>;
  element: N;
  map: MapWrapper<M>;
  initOptions: CoreInitOptions<M>;
  args: unknown[];
};
