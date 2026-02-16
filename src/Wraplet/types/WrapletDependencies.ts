import { WrapletDependencyMap } from "./WrapletDependencyMap";
import { InstantiableReturnType } from "../../utils/types/Utils";
import { WrapletSet } from "../../Set/types/WrapletSet";

export type OptionalSingleInstantiableReturnType<
  T extends WrapletDependencyMap,
  K extends keyof T,
> = T[K]["required"] extends true
  ? InstantiableReturnType<T[K]["Class"]>
  : InstantiableReturnType<T[K]["Class"]> | null;

export type WrapletDependencies<T extends WrapletDependencyMap> = {
  [id in keyof T]: T[id]["multiple"] extends true
    ? WrapletSet<InstantiableReturnType<T[id]["Class"]>>
    : OptionalSingleInstantiableReturnType<T, id>;
};
