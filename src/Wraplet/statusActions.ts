import { StatusWritable } from "../Wraplet/types/Status";
import { DestroyListener } from "../DependencyManager/types/DestroyListener";
import { Wraplet } from "../Wraplet/types/Wraplet";
import { LifecycleError } from "../errors";

export function initializationStarted(status: StatusWritable): boolean {
  if (
    status.isInitialized ||
    status.isGettingInitialized ||
    status.isDestroyed ||
    status.isGettingDestroyed
  ) {
    return false;
  }
  status.isGettingInitialized = true;

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

export function destructionStarted(status: StatusWritable): boolean {
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

  return true;
}

export async function destructionCompleted(
  status: StatusWritable,
  wraplet: Wraplet,
  destroyListeners: DestroyListener[],
): Promise<void> {
  status.isGettingDestroyed = false;
  status.isInitialized = false;
  status.isDestroyed = true;

  for (const listener of [...destroyListeners].reverse()) {
    await listener(wraplet);
  }

  destroyListeners.length = 0;
}
