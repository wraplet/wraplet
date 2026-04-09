import { WrapletApiFactoryBasicCallback } from "./WrapletApiFactoryCallbacks";
import { Dependencies } from "./Wraplet";

export type DependencyApiFactoryArgs = {
  wraplet: Dependencies;
  destroyCallback?: WrapletApiFactoryBasicCallback;
  initializeCallback?: WrapletApiFactoryBasicCallback;
};
