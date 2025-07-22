import { Wraplet } from "./Wraplet";

export type WrapletChildDefinition<T extends Wraplet = Wraplet> = {
  selector?: string;
  Class: { new (...args: any[]): T };
  required: boolean;
  multiple: boolean;
  args?: unknown[];
  destructible?: boolean;
};
