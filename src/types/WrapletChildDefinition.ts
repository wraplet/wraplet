import { AbstractWraplet } from "../AbstractWraplet";

export type WrapletChildDefinition<
  T extends AbstractWraplet = AbstractWraplet,
> = {
  selector?: string;
  Class: { new (...args: any[]): T };
  required: boolean;
  multiple: boolean;
  args?: unknown[];
};
