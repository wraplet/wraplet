import { WrapletDependencyMap } from "./WrapletDependencyMap";
import { InstantiableReturnType } from "../../utils/types/Utils";

export type DependencyInstance<
  M extends WrapletDependencyMap,
  K extends keyof M = keyof M,
> = InstantiableReturnType<M[K]["Class"]>;
