import { AbstractWraplet } from "../AbstractWraplet";

export type WrapletChildDefinition<
  T extends AbstractWraplet<any, any, any> = AbstractWraplet<any, any, any>,
> = {
  selector?: string;
  Class: { new (...args: any[]): T };
  required: boolean;
  multiple: boolean;
  args?: unknown[];
  destructible?: boolean;
};
