import { DestroyListener } from "../../Core/types/DestroyListener";

import { Status } from "./Status";
import { Wraplet } from "../../Wraplet/types/Wraplet";

export interface WrapletApi<N extends Node = Node> {
  status: Status;

  accessNode(callback: (node: N) => void): void;

  destroy(): Promise<void>;

  initialize(): Promise<void>;

  addDestroyListener(callback: DestroyListener<Wraplet<N>>): void;
}

export interface WrapletApiDebug<N extends Node> {
  __nodeAccessors: ((node: N) => void)[];
}
