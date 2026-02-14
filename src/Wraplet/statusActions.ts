import { StatusWritable } from "../Wraplet/types/Status";
import { Core } from "../Core/types/Core";
import { DestroyListener } from "../Core/types/DestroyListener";
import { Wraplet } from "../Wraplet/types/Wraplet";
import { WrapletChildrenMap } from "../Wraplet/types/WrapletChildrenMap";
import {addWrapletToNode, removeWrapletFromNode} from "../NodeTreeManager/utils";

export async function initializationStarted<
  N extends Node,
  M extends WrapletChildrenMap,
>(
  status: StatusWritable,
  core: Core<N, M>,
  wraplet: Wraplet<N>,
): Promise<boolean> {
  if (status.isInitialized) {
    return false;
  }
  status.isGettingInitialized = true;
  addWrapletToNode(wraplet, core.node);

  await core.initializeChildren();
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
  W extends Wraplet<N>,
  M extends WrapletChildrenMap,
>(
  status: StatusWritable,
  core: Core<N, M>,
  wraplet: W,
  destroyListeners: DestroyListener<W>[],
): Promise<boolean> {
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
    status.isDestroyed = true;
    status.isGettingDestroyed = false;
    return false;
  }

  await core.destroy();
  for (const listener of destroyListeners.reverse()) {
    await listener(wraplet);
  }

  return true;
}

export async function destructionCompleted<
  N extends Node,
  W extends Wraplet<N>,
  M extends WrapletChildrenMap,
>(status: StatusWritable, core: Core<N, M>, wraplet: W): Promise<void> {
  removeWrapletFromNode(wraplet, core.node);
  status.isGettingDestroyed = false;
  status.isInitialized = false;
  status.isDestroyed = true;
}
