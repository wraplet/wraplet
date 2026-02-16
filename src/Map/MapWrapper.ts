import {
  isWrapletDependencyMap,
  WrapletDependencyMap,
  WrapletDependencyMapWithDefaults,
} from "../Wraplet/types/WrapletDependencyMap";
import { fillMapWithDefaults } from "./utils";
import { isDynamicMap } from "./types/DynamicMap";

type RecursiveMapKeys<T extends WrapletDependencyMap> = {
  [K in keyof T]: T[K] extends { map: infer M extends WrapletDependencyMap }
    ? K | RecursiveMapKeys<M>
    : K;
}[keyof T];

export class MapWrapper<M extends WrapletDependencyMap> {
  private readonly fullMap: WrapletDependencyMapWithDefaults<M>;
  private startingPath: string[];
  private currentMap: WrapletDependencyMapWithDefaults<M> | null = null;
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

  public getStartingMap(): WrapletDependencyMapWithDefaults<M> {
    return this.resolve(this.startingPath);
  }

  public getCurrentMap(): WrapletDependencyMapWithDefaults<M> {
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
  private findMap(path: string[]): WrapletDependencyMapWithDefaults<M> {
    let resultMap: WrapletDependencyMapWithDefaults<M> = this.fullMap;

    for (const pathPart of path) {
      if (!resultMap[pathPart]) {
        throw new Error(
          `Invalid path: ${this.path.join(".")} . No such definition.`,
        );
      }

      const map = resultMap[pathPart]["map"];
      if (isWrapletDependencyMap(map)) {
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
    let tempMap: WrapletDependencyMapWithDefaults = this.fullMap;
    for (const pathPart of path) {
      if (!Object.hasOwn(tempMap, pathPart)) {
        return false;
      }

      const map = tempMap[pathPart]["map"];
      if (isDynamicMap(map)) {
        return true;
      }

      if (!isWrapletDependencyMap(map)) {
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
  ): MapWrapper<WrapletDependencyMapWithDefaults<M>> {
    return new MapWrapper<WrapletDependencyMapWithDefaults<M>>(
      this.fullMap,
      path,
      resolveImmediately,
    );
  }

  public resolve(path: string[]): WrapletDependencyMapWithDefaults<M> {
    return this.findMap(path);
  }
}
