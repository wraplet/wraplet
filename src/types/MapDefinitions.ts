import { WrapletChildrenMap } from "./WrapletChildrenMap";
import { MapRepeat } from "../Map/MapRepeat";

export type MapDefinitions<M extends WrapletChildrenMap = WrapletChildrenMap> =
  | M
  | MapRepeat;
