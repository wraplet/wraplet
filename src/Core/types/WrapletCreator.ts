import { Wraplet } from "./Wraplet";
import { MapWrapper } from "../../Map/MapWrapper";
import {
  WrapletChildrenMap,
  WrapletChildrenMapWithDefaults,
} from "./WrapletChildrenMap";
import { CoreInitOptions } from "./CoreInitOptions";
import { Constructable } from "../../utils/types/Utils";

export type WrapletCreator<N extends Node, M extends WrapletChildrenMap> = (
  args: WrapletCreatorArgs<N, M>,
) => Wraplet<N>;

export type WrapletCreatorArgs<N extends Node, M extends WrapletChildrenMap> = {
  id: keyof M;
  Class: Constructable<Wraplet<N>>;
  element: Node;
  map: MapWrapper<WrapletChildrenMapWithDefaults>;
  initOptions: CoreInitOptions<M>;
  args: unknown[];
  defaultCreator: WrapletCreator<N, M>;
};
