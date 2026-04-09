import { is } from "../../utils/is";
import { DependencyApi } from "./DependencyApi";
import { WrapletApi } from "./WrapletApi";

export const DependencySymbol = Symbol("Dependency");

export interface Dependency {
  [DependencySymbol]: true;
  wraplet: DependencyApi;
}

export function isDependency(object: unknown): object is Dependency {
  return is(object, DependencySymbol) || is(object, WrapletSymbol);
}

export const WrapletSymbol = Symbol("Wraplet");

export interface Wraplet<N extends Node = Node> {
  [WrapletSymbol]: true;
  wraplet: WrapletApi<N>;
}

export function isWraplet<N extends Node>(
  object: unknown,
): object is Wraplet<N> {
  return is(object, WrapletSymbol);
}

export type Dependencies = Wraplet | Dependency;
