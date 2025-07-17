import { InstantiateChildListener } from "./InstantiateChildListener";
import { WrapletChildrenMap } from "./WrapletChildrenMap";
import { DestroyChildListener } from "./DestroyChildListener";
import { DeepWriteable } from "./Utils";

export type CoreInitOptions<M extends WrapletChildrenMap> = {
  instantiateChildListeners: InstantiateChildListener<M, keyof M>[];
  destroyChildListeners: DestroyChildListener<M, keyof M>[];
  mapAlterCallback?: (map: DeepWriteable<M>) => void;
};
