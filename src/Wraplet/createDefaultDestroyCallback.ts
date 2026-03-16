import { Status } from "./types/Status";
import { WrapletApiFactoryBasicCallback } from "./types/WrapletApiFactoryBasicCallback";
import { Core } from "../Core/types/Core";
import { Wraplet } from "./types/Wraplet";
import { DestroyListener } from "../Core/types/DestroyListener";
import { WrapletDependencyMap } from "./types/WrapletDependencyMap";
import {
  destructionCompleted,
  destructionStarted,
} from "../Wraplet/statusActions";

export type DefaultDestroyCallbackArgs<
  N extends Node,
  M extends WrapletDependencyMap,
> = {
  core: Core<N, M>;
  wraplet: Wraplet<N>;
  destroyListeners: DestroyListener<Wraplet<N>>[];
  status?: Status;
};

export function createDefaultDestroyCallback<
  N extends Node,
  M extends WrapletDependencyMap,
>(
  args: DefaultDestroyCallbackArgs<N, M>,
  customDestroyLogic?: WrapletApiFactoryBasicCallback,
): () => Promise<void> {
  return async function () {
    // @ts-expect-error "this" is a fallback if status is not provided.
    if (!args.status && (!this || !this.status)) {
      throw new Error("Cannot destroy without status available.");
    }

    // @ts-expect-error Default callbacks depend on the status from the outer object for easier usage.
    const outerStatus: Status = args.status || this.status;
    if (!(await destructionStarted(outerStatus, args.core))) {
      return;
    }

    // @ts-expect-error This is optional.
    if (this && this.__nodeAccessors && Array.isArray(this.__nodeAccessors)) {
      // @ts-expect-error Clean up the __nodeAccessors array if it's available.
      this.__nodeAccessors.length = 0;
    }

    if (customDestroyLogic) {
      await customDestroyLogic();
    }

    await destructionCompleted(
      outerStatus,
      args.core,
      args.wraplet,
      args.destroyListeners,
    );
  };
}
