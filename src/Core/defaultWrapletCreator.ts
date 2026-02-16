import { WrapletCreatorArgs } from "./types/WrapletCreator";
import { WrapletDependencyMap } from "../Wraplet/types/WrapletDependencyMap";
import { Constructable } from "../utils/types/Utils";
import { Core } from "./types/Core";
import { Wraplet } from "../Wraplet/types/Wraplet";

export function defaultWrapletCreator(
  args: WrapletCreatorArgs<Node, WrapletDependencyMap>,
  currentCoreClass: Constructable<Core>,
): Wraplet {
  const core = new currentCoreClass(args.element, args.map, args.initOptions);

  return new args.Class(core, ...args.args);
}
