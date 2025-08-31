import { WrapletChildrenMap } from "./WrapletChildrenMap";
import { InstantiableReturnType } from "./Utils";
import { WrapletSet } from "./Set/WrapletSet";

export type OptionalSingleInstantiableReturnType<
  T extends WrapletChildrenMap,
  K extends keyof T,
> = T[K]["required"] extends true
  ? InstantiableReturnType<T[K]["Class"]>
  : InstantiableReturnType<T[K]["Class"]> | null;

export type WrapletChildren<T extends WrapletChildrenMap> = {
  [id in keyof T]: T[id]["multiple"] extends true
    ? WrapletSet<InstantiableReturnType<T[id]["Class"]>>
    : OptionalSingleInstantiableReturnType<T, id>;
};
