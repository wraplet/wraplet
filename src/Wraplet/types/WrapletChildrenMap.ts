import {
  WrapletChildDefinition,
  WrapletChildDefinitionWithDefaults,
} from "./WrapletChildDefinition";

export type WrapletChildrenMap = {
  [id: string]: WrapletChildDefinition;
};

export type WrapletChildrenMapWithDefaults<
  M extends WrapletChildrenMap = WrapletChildrenMap,
> = {
  [key in keyof M]: WrapletChildDefinitionWithDefaults<M[key], M>;
};

function isSimpleObject(input: unknown): input is Record<string, unknown> {
  return (
    typeof input === "object" &&
    input !== null &&
    Object.getPrototypeOf(input) === Object.prototype
  );
}

function isChildrenMapItem(item: Record<string, unknown>): boolean {
  for (const key of Object.keys(item)) {
    if (
      ![
        "selector",
        "Class",
        "multiple",
        "required",
        "destructible",
        "coreOptions",
        "map",
        "args",
      ].includes(key)
    ) {
      return false;
    }
  }

  if (typeof item["Class"] !== "function") {
    return false;
  }

  if (typeof item["required"] !== "boolean") {
    return false;
  }

  return typeof item["multiple"] === "boolean";
}

export function isWrapletChildrenMap(
  object: unknown,
): object is WrapletChildrenMapWithDefaults {
  if (!isSimpleObject(object)) {
    return false;
  }

  for (const key in object) {
    if (!isSimpleObject(object[key])) {
      return false;
    }

    const item = object[key];
    if (!isChildrenMapItem(item)) {
      return false;
    }
  }

  return true;
}
