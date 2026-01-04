import { RichWrapletApi } from "../Wraplet/types/RichWrapletApi";

export function customizeDefaultWrapletApi<
  N extends Node,
  A extends RichWrapletApi<N>,
>(args: Partial<RichWrapletApi<N>>, wrapletApi: A): A {
  if (!args.status && (args.destroy || args.initialize)) {
    throw new Error(
      "Cannot customize lifecycle callbacks without providing status. This is because all callbacks have to share the same status.",
    );
  }

  // We don't want to create a new object because the default callbacks are bound to the old one.
  return Object.assign(wrapletApi, args);
}
