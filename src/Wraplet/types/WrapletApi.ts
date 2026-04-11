import { is } from "../../utils/is";
import { DestroyListener } from "../../DependencyManager/types/DestroyListener";
import { Status } from "./Status";

export const WrapletApiSymbol = Symbol("WrapletApi");

export interface WrapletApi {
  [WrapletApiSymbol]: true;

  status: Status;

  destroy(): Promise<void>;

  initialize(): Promise<void>;

  addDestroyListener(callback: DestroyListener): void;
}

export function isWrapletApi(object: unknown): object is WrapletApi {
  return is(object, WrapletApiSymbol);
}

export interface WrapletApiDebug {
  __destroyListeners: DestroyListener[];
}
