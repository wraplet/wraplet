import { DestroyListener } from "../../DependencyManager/types/DestroyListener";

import { Status } from "./Status";
import { is } from "../../utils/is";
import { WrapletApiSymbol } from "./WrapletApi";

export const DependencyApiSymbol = Symbol("DependencyApi");

export interface BaseWrapletApi {
  status: Status;

  destroy(): Promise<void>;

  initialize(): Promise<void>;

  addDestroyListener(callback: DestroyListener): void;
}

export interface DependencyApi extends BaseWrapletApi {
  [DependencyApiSymbol]: true;
}

export function isDependencyApi(object: unknown): object is DependencyApi {
  return is(object, DependencyApiSymbol) || is(object, WrapletApiSymbol);
}

export interface DependencyApiDebug {
  __destroyListeners: DestroyListener[];
}
