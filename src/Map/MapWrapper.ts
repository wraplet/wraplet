import {
  isWrapletChildrenMapWithDefaults,
  WrapletChildrenMap,
  WrapletChildrenMapWithDefaults,
} from "../types/WrapletChildrenMap";
import { fillMapWithDefaults } from "../WrapletChildrenMap";
import { isDynamicMap } from "./types/DynamicMap";

type RecursiveMapKeys<T extends WrapletChildrenMap> = {
  [K in keyof T]: T[K] extends { map: infer M extends WrapletChildrenMap }
    ? K | RecursiveMapKeys<M>
    : K;
}[keyof T];

export class MapWrapper<M extends WrapletChildrenMap> {
  private readonly fullMap: WrapletChildrenMapWithDefaults<M>;
  private startingPath: string[];
  private currentMap: WrapletChildrenMapWithDefaults<M> | null = null;
  public path: string[];
  private currentPath: string[] = [];

  /**
   * @param fullMap
   * @param path
   *   Path to the current definition.
   * @param resolveImmediately
   */
  constructor(
    fullMap: M,
    path: (RecursiveMapKeys<M> | string)[] = [],
    resolveImmediately: boolean = true,
  ) {
    this.path = path as string[];
    this.startingPath = path as string[];

    this.fullMap = fillMapWithDefaults(fullMap);

    if (resolveImmediately) {
      this.currentMap = this.resolve(this.path);
    }
  }

  public getStartingMap(): WrapletChildrenMapWithDefaults<M> {
    return this.resolve(this.startingPath);
  }

  public getCurrentMap(): WrapletChildrenMapWithDefaults<M> {
    if (!this.currentMap || this.currentPath != this.path) {
      this.currentMap = this.resolve(this.path);
      this.currentPath = this.path;
    }

    return this.currentMap;
  }

  /**
   * @param path
   * @private
   */
  private findMap(path: string[]): WrapletChildrenMapWithDefaults<M> {
    let resultMap: WrapletChildrenMapWithDefaults<M> = this.fullMap;

    for (const pathPart of path) {
      if (!resultMap[pathPart]) {
        throw new Error(
          `Invalid path: ${this.path.join(".")} . No such definition.`,
        );
      }

      const map = resultMap[pathPart]["map"];
      if (isWrapletChildrenMapWithDefaults(map)) {
        resultMap = map;
      } else if (isDynamicMap(map)) {
        resultMap = map.create(this.clone(path, false));
      } else {
        throw new Error("Invalid map type.");
      }
    }

    return resultMap;
  }

  public up(pathPart: string, resolve: boolean = true): void {
    if (!this.pathExists([...this.path, pathPart])) {
      throw new Error("Map doesn't exist.");
    }
    this.path.push(pathPart);
    if (resolve) {
      this.currentMap = this.resolve(this.path);
    }
  }

  private pathExists(path: string[]): boolean {
    let tempMap: WrapletChildrenMapWithDefaults = this.fullMap;
    for (const pathPart of path) {
      if (!Object.hasOwn(tempMap, pathPart)) {
        return false;
      }

      const map = tempMap[pathPart]["map"];
      if (isDynamicMap(map)) {
        return true;
      }

      if (!isWrapletChildrenMapWithDefaults(map)) {
        throw new Error("Invalid map type.");
      }

      tempMap = map;
    }

    return true;
  }

  public down(resolve: boolean = true): void {
    if (this.path.length === 0) {
      throw new Error("At the root already.");
    }
    this.path.pop();
    if (resolve) {
      this.currentMap = this.resolve(this.path);
    }
  }

  public clone(
    path: string[],
    resolveImmediately: boolean = true,
  ): MapWrapper<WrapletChildrenMapWithDefaults<M>> {
    return new MapWrapper<WrapletChildrenMapWithDefaults<M>>(
      this.fullMap,
      path,
      resolveImmediately,
    );
  }

  public resolve(path: string[]): WrapletChildrenMapWithDefaults<M> {
    return this.findMap(path);
  }
}
