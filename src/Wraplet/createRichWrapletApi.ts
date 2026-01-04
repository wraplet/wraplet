import { WrapletChildrenMap } from "./types/WrapletChildrenMap";
import { Wraplet } from "./types/Wraplet";
import { defaultGroupableAttribute, GroupExtractor } from "../types/Groupable";
import { WrapletApiDebug } from "./types/WrapletApi";
import { RichWrapletApi } from "./types/RichWrapletApi";
import { createWrapletApi } from "./createWrapletApi";
import { RichWrapletApiFactoryArgs } from "./types/RichWrapletApiFactoryArgs";

export const createRichWrapletApi = <
  N extends Node,
  M extends WrapletChildrenMap,
>(
  args: RichWrapletApiFactoryArgs<N, M>,
): RichWrapletApi<N> & WrapletApiDebug<N> => {
  const defaultGroupExtractor: GroupExtractor = (node: Node) => {
    if (node instanceof Element) {
      const groupsString = node.getAttribute(defaultGroupableAttribute);
      if (groupsString) {
        return groupsString.split(",");
      }
    }

    return [];
  };

  let groupExtractor: GroupExtractor =
    args.groupExtractor || defaultGroupExtractor;

  return Object.assign(createWrapletApi(args), {
    getNodeTreeChildren: (): Wraplet[] => {
      return args.core.getNodeTreeChildren();
    },

    setGroupsExtractor: (extractor: GroupExtractor) => {
      groupExtractor = extractor;
    },

    getGroups: () => {
      return groupExtractor(args.core.node);
    },
  });
};
