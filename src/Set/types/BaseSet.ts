import { WrapletSet } from "./WrapletSet";
import { Wraplet } from "../../Wraplet/types/Wraplet";

export interface BaseSet<T extends Wraplet> {
  find(filter: (wraplet: T) => boolean): WrapletSet<T>;
  findOne(filter: (wraplet: T) => boolean): T | null;
  getOrdered(callback: (item: T) => number): T[];
}
