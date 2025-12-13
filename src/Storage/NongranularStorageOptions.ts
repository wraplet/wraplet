import { ElementOptionsMerger } from "./ElementOptionsMerger";

export type NongranularStorageOptions<D extends Record<string, unknown>> = {
  keepFresh: boolean;
  elementOptionsMerger: ElementOptionsMerger<D>;
};
