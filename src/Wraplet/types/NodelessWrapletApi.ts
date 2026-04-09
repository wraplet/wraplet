import { DestroyListener } from "../../DependencyManager/types/DestroyListener";

import { Status } from "./Status";
import { is } from "../../utils/is";

export const NodelessWrapletApiSymbol = Symbol("NodelessWrapletApi");

export interface BaseWrapletApi {
  status: Status;

  destroy(): Promise<void>;

  initialize(): Promise<void>;

  addDestroyListener(callback: DestroyListener): void;
}

export interface NodelessWrapletApi extends BaseWrapletApi {
  [NodelessWrapletApiSymbol]: true;
}

export function isNodelessWrapletApi(
  object: unknown,
): object is NodelessWrapletApi {
  return is(object, NodelessWrapletApiSymbol);
}

export interface NodelessWrapletApiDebug {
  __destroyListeners: DestroyListener[];
}
