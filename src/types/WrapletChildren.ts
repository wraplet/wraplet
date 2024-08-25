import { WrapletChildrenMap } from "./WrapletChildrenMap";
import { InstantiableReturnType } from "./Utils";

export type WrapletChildren<T extends WrapletChildrenMap> = {
  [id in keyof T]: T[id]["multiple"] extends true
    ? InstantiableReturnType<T[id]["Class"]>[]
    : T[id]["required"] extends true
      ? InstantiableReturnType<T[id]["Class"]>
      : InstantiableReturnType<T[id]["Class"]> | null;
};
