import { WrapletApi } from "./types/WrapletApi";
import { Wiring } from "./composeWrapletApi";

export function wire(api: WrapletApi, wiring: Wiring) {
  if (wiring.initializeCallback) {
    api.onInitialize(wiring.initializeCallback);
  }
  if (wiring.destroyCallback) {
    api.onDestroy(wiring.destroyCallback);
  }
}
