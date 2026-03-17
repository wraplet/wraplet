import { WrapletApi } from "./WrapletApi";
import { NodeTreeParent } from "../../NodeTreeManager/types/NodeTreeParent";

export type DependentWrapletApi<N extends Node> = WrapletApi<N> &
  NodeTreeParent["wraplet"];
