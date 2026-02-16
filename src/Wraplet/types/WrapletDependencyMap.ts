import {
  WrapletDependencyDefinition,
  WrapletDependencyDefinitionWithDefaults,
} from "./WrapletDependencyDefinition";

export type WrapletDependencyMap = {
  [id: string]: WrapletDependencyDefinition;
};

export type WrapletDependencyMapWithDefaults<
  M extends WrapletDependencyMap = WrapletDependencyMap,
> = {
  [key in keyof M]: WrapletDependencyDefinitionWithDefaults<M[key], M>;
};

function isSimpleObject(input: unknown): input is Record<string, unknown> {
  return (
    typeof input === "object" &&
    input !== null &&
    Object.getPrototypeOf(input) === Object.prototype
  );
}

function isDependencyMapItem(item: Record<string, unknown>): boolean {
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

export function isWrapletDependencyMap(
  object: unknown,
): object is WrapletDependencyMapWithDefaults {
  if (!isSimpleObject(object)) {
    return false;
  }

  for (const key in object) {
    if (!isSimpleObject(object[key])) {
      return false;
    }

    const item = object[key];
    if (!isDependencyMapItem(item)) {
      return false;
    }
  }

  return true;
}
