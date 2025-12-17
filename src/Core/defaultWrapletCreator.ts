import { WrapletCreatorArgs } from "./types/WrapletCreator";
import { WrapletChildrenMap } from "../Wraplet/types/WrapletChildrenMap";
import { Constructable } from "../utils/types/Utils";
import { Core } from "./types/Core";
import { Wraplet } from "../Wraplet/types/Wraplet";

export function defaultWrapletCreator(
  args: WrapletCreatorArgs<Node, WrapletChildrenMap>,
  currentCoreClass: Constructable<Core>,
): Wraplet {
  const core = new currentCoreClass(args.element, args.map, args.initOptions);

  return new args.Class(core, ...args.args);
}
