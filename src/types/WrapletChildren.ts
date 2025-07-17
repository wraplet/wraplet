import { WrapletChildrenMap } from "./WrapletChildrenMap";
import { InstantiableReturnType } from "./Utils";

export type OptionalSingleInstantiableReturnType<
  T extends WrapletChildrenMap,
  K extends keyof T,
> = T[K]["required"] extends true
  ? InstantiableReturnType<T[K]["Class"]>
  : InstantiableReturnType<T[K]["Class"]> | null;

export type WrapletChildren<T extends WrapletChildrenMap> = {
  [id in keyof T]: T[id]["multiple"] extends true
    ? InstantiableReturnType<T[id]["Class"]>[]
    : OptionalSingleInstantiableReturnType<T, id>;
};
