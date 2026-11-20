import { is } from "../../utils/is";
import { LifecycleListener } from "./LifecycleListener";
import { Status } from "./Status";

export const WrapletApiSymbol = Symbol("WrapletApi");

export interface WrapletApi {
  [WrapletApiSymbol]: true;

  status: Status;

  destroy(): Promise<void>;

  initialize(): Promise<void>;

  onInitialize(callback: LifecycleListener): void;

  onDestroy(callback: LifecycleListener): void;

  onAfterDestroy(callback: LifecycleListener): void;
}

export function isWrapletApi(object: unknown): object is WrapletApi {
  return is(object, WrapletApiSymbol);
}

export interface WrapletApiDebug {
  __initializeListeners: LifecycleListener[];
  __destroyListeners: LifecycleListener[];
}
