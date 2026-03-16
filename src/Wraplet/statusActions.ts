import { StatusWritable } from "../Wraplet/types/Status";
import { Core } from "../Core/types/Core";
import { DestroyListener } from "../Core/types/DestroyListener";
import { Wraplet } from "../Wraplet/types/Wraplet";
import { WrapletDependencyMap } from "./types/WrapletDependencyMap";
import {
  addWrapletToNode,
  removeWrapletFromNode,
} from "../NodeTreeManager/utils";
import { LifecycleError } from "../errors";

export async function initializationStarted<
  N extends Node,
  M extends WrapletDependencyMap,
>(
  status: StatusWritable,
  core: Core<N, M>,
  wraplet: Wraplet<N>,
): Promise<boolean> {
  if (
    status.isInitialized ||
    status.isGettingInitialized ||
    status.isDestroyed ||
    status.isGettingDestroyed
  ) {
    return false;
  }
  status.isGettingInitialized = true;
  addWrapletToNode(wraplet, core.node);

  await core.initializeDependencies();
  return true;
}

export async function initializationCompleted(
  status: StatusWritable,
  destroyMethod: () => Promise<void>,
): Promise<void> {
  status.isInitialized = true;
  status.isGettingInitialized = false;

  // If destruction has been invoked in the meantime, we can finally do it, when initialization
  // is finished.
  if (status.isGettingDestroyed) {
    await destroyMethod();
  }
}

export async function destructionStarted<
  N extends Node,
  M extends WrapletDependencyMap,
>(status: StatusWritable, core: Core<N, M>): Promise<boolean> {
  if (status.isDestroyed) {
    return false;
  }
  status.isGettingDestroyed = true;
  if (status.isGettingInitialized) {
    // If we are still initializing, then postpone destruction until after
    // initialization is finished.
    // We are leaving this method, but with `isGettingDestroyed` set to true, so
    // the initialization process will know to return here after it will finish.
    return false;
  }

  if (!status.isInitialized) {
    // If we are not initialized, then we have nothing to do here.
    throw new LifecycleError(
      "Wraplet cannot be destroyed before it is initialized.",
    );
  }

  await core.destroy();

  return true;
}

export async function destructionCompleted<
  N extends Node,
  W extends Wraplet<N>,
  M extends WrapletDependencyMap,
>(
  status: StatusWritable,
  core: Core<N, M>,
  wraplet: W,
  destroyListeners: DestroyListener<W>[],
): Promise<void> {
  removeWrapletFromNode(wraplet, core.node);
  status.isGettingDestroyed = false;
  status.isInitialized = false;
  status.isDestroyed = true;

  for (const listener of [...destroyListeners].reverse()) {
    await listener(wraplet);
  }

  destroyListeners.length = 0;
}
