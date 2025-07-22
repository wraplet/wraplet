import { Wraplet } from "./Wraplet";

export type WrapletChildDefinition = {
  selector?: string;
  Class: { new (...args: any[]): Wraplet };
  required: boolean;
  multiple: boolean;
  args?: unknown[];
  destructible?: boolean;
};
