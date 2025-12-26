import { WrapletApi } from "./WrapletApi";
import { NodeTreeParent } from "../../NodeTreeManager/types/NodeTreeParent";
import { Groupable } from "../../types/Groupable";

export type RichWrapletApi<N extends Node> = WrapletApi<N> &
  NodeTreeParent["wraplet"] &
  Groupable["wraplet"];
