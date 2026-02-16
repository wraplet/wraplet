import { WrapletDependencies } from "../Wraplet/types/WrapletDependencies";
import { Nullable } from "../utils/types/Utils";
import {
  DependenciesAreAlreadyDestroyedError,
  DependenciesAreNotAvailableError,
  TooManyChildrenFoundError,
  InternalLogicError,
  MapError,
  MissingRequiredDependencyError,
  RequiredDependencyDestroyedError,
  UnsupportedNodeTypeError,
} from "../errors";
import { Wraplet } from "../Wraplet/types/Wraplet";
import {
  isWrapletDependencyMap,
  WrapletDependencyMap,
  WrapletDependencyMapWithDefaults,
} from "../Wraplet/types/WrapletDependencyMap";
import { isParentNode } from "../NodeTreeManager/utils";
import { DependencyInstantiatedListener } from "./types/DependencyInstantiatedListener";
import { DependencyInstance } from "../Wraplet/types/DependencyInstance";
import { DependencyDestroyedListener } from "./types/DestroyDependencyListener";
import { CoreInitOptions } from "./types/CoreInitOptions";
import { Core, CoreSymbol } from "./types/Core";
import { DestroyListener } from "./types/DestroyListener";
import { isWrapletSet, WrapletSet } from "../Set/types/WrapletSet";
import { DefaultWrapletSet } from "../Set/DefaultWrapletSet";
import {
  SelectorCallback,
  WrapletDependencyDefinitionWithDefaults,
} from "../Wraplet/types/WrapletDependencyDefinition";
import { NodeTreeParentSymbol } from "../NodeTreeManager/types/NodeTreeParent";
import { MapWrapper } from "../Map/MapWrapper";
import { WrapletCreator, WrapletCreatorArgs } from "./types/WrapletCreator";
import { isArgCreator } from "./types/ArgCreator";
import { defaultWrapletCreator } from "./defaultWrapletCreator";
import { Status, StatusWritable } from "../Wraplet/types/Status";

type ListenerData = {
  node: Node;
  eventName: string;
  callback: EventListenerOrEventListenerObject;
  options?: AddEventListenerOptions | boolean;
};

export class DefaultCore<
  N extends Node = Node,
  M extends WrapletDependencyMap = {},
> implements Core<N, M> {
  public [CoreSymbol]: true = true;
  public [NodeTreeParentSymbol]: true = true;
  private dependenciesAreInstantiated: boolean = false;
  private statusWritable: StatusWritable = {
    isDestroyed: false,
    isGettingDestroyed: false,
    isInitialized: false,
    isGettingInitialized: false,
  };

  public get status(): Status {
    return this.statusWritable;
  }

  public mapWrapper: MapWrapper<M>;
  private instantiatedDependencies: Partial<WrapletDependencies<M>> = {};

  private destroyedDependencyListeners: DependencyDestroyedListener<
    M,
    keyof M
  >[] = [];
  private instantiatedDependencyListeners: DependencyInstantiatedListener<
    M,
    keyof M
  >[] = [];
  private listeners: ListenerData[] = [];

  private wrapletCreator: WrapletCreator<Node, WrapletDependencyMap> =
    defaultWrapletCreator;

  constructor(
    public node: N,
    map: M | MapWrapper<M>,
    initOptions: Partial<CoreInitOptions<M>> = {},
  ) {
    if (!(node instanceof Node)) {
      throw new Error("The node provided to the Core is not a valid node.");
    }
    if (isWrapletDependencyMap(map)) {
      this.mapWrapper = new MapWrapper(map);
    } else if (map instanceof MapWrapper) {
      this.mapWrapper = map;
    } else {
      throw new MapError("The map provided to the Core is not a valid map.");
    }

    this.processInitOptions(initOptions);
    this.instantiatedDependencies = {};
  }

  /**
   * Initialize core.
   *
   * We couldn't put this step in the constructor, because during initialization some wraplet
   * processing occurs (instantiate dependency listeners) that needs access to the Core,
   * so the Core has to exist already.
   */
  public async initializeDependencies() {
    this.statusWritable.isGettingInitialized = true;

    const dependencyInstances: Wraplet[] = Object.values(
      this.instantiatedDependencies,
    ).flatMap((dependency) => {
      if (!dependency) return [];
      return isWrapletSet(dependency) ? Array.from(dependency) : [dependency];
    });

    await Promise.all(
      dependencyInstances.map((dependency) => dependency.wraplet.initialize()),
    );

    this.statusWritable.isInitialized = true;
    this.statusWritable.isGettingInitialized = false;

    // If destruction has been invoked in the meantime, we can finally do it when initialization
    // is finished.
    if (this.statusWritable.isGettingDestroyed) {
      await this.destroy();
    }
  }

  public get map(): WrapletDependencyMapWithDefaults<M> {
    return this.mapWrapper.getStartingMap() as WrapletDependencyMapWithDefaults<M>;
  }

  public instantiateDependencies(): void {
    const dependencies: Partial<Nullable<WrapletDependencies<M>>> =
      this.instantiatedDependencies;
    // We check if are dealing with the ParentNode object.
    if (!isParentNode(this.node)) {
      for (const id in this.map) {
        const dependencyDefinition = this.map[id];
        this.validateMapItemForNonParent(id, dependencyDefinition);
      }
      return;
    }
    for (const id in this.map) {
      const dependencyDefinition = this.map[id];
      const multiple = dependencyDefinition.multiple;

      const mapWrapper = this.mapWrapper.clone([...this.mapWrapper.path, id]);

      this.validateMapItem(id, dependencyDefinition);
      if (multiple) {
        // We can assert as much because items
        dependencies[id] = this.instantiateMultipleDependencies(
          dependencyDefinition,
          mapWrapper,
          this.node,
          id,
        );
        continue;
      }

      dependencies[id] = this.instantiateSingleWrapletDependency(
        dependencyDefinition,
        mapWrapper,
        this.node,
        id,
      );
    }
    if (!this.dependenciesAreInstantiated) {
      this.instantiatedDependencies = this.wrapDependencies(
        dependencies as WrapletDependencies<M>,
      );
      this.dependenciesAreInstantiated = true;
    }
  }

  public async syncDependencies(): Promise<void> {
    this.instantiateDependencies();
    await this.initializeDependencies();
  }

  public getChildrenDependencies(): Wraplet[] {
    const dependencies: Wraplet[] = [];
    for (const dependency of Object.values(this.dependencies)) {
      if (dependency === null) {
        continue;
      }
      if (isWrapletSet(dependency)) {
        for (const item of dependency) {
          dependencies.push(item);
        }
      } else {
        dependencies.push(dependency);
      }
    }

    // Return only descendants.
    return dependencies.filter((dependency) => {
      let result = false;
      dependency.wraplet.accessNode((childsNode) => {
        result = this.node.contains(childsNode);
      });
      return result;
    });
  }

  private findExistingWraplet(id: keyof M, childElement: Node): Wraplet | null {
    // If an element doesn't have instantiated wraplets yet, then return null.
    if (
      this.instantiatedDependencies === undefined ||
      !this.instantiatedDependencies[id]
    ) {
      return null;
    }
    const existingDependency = this.instantiatedDependencies[id];
    // Handle multiple.
    if (this.map[id]["multiple"]) {
      if (!isWrapletSet<Wraplet<N>>(existingDependency)) {
        throw new InternalLogicError(
          "Internal logic error. Expected a WrapletSet.",
        );
      }

      const existingWraplets = existingDependency.find((wraplet) => {
        let result = false;

        wraplet.wraplet.accessNode((node) => {
          if (node === childElement) {
            result = true;
          }
        });

        return result;
      });

      if (existingWraplets.length === 0) {
        return null;
      }

      if (existingWraplets.length > 1) {
        throw new InternalLogicError(
          "Internal logic error. Multiple instances wrapping the same element found in the core.",
        );
      }

      return existingWraplets[0];
    }

    // Handle single.
    return existingDependency as Wraplet<N>;
  }

  private instantiateSingleWrapletDependency<T extends keyof M>(
    dependencyDefinition: WrapletDependencyDefinitionWithDefaults<M[T], M>,
    dependencyMap: MapWrapper<WrapletDependencyMapWithDefaults<M>>,
    node: ParentNode,
    id: Extract<T, string>,
  ): WrapletDependencies<M>[T] | null {
    if (!dependencyDefinition.selector) {
      return null;
    }
    const selector = dependencyDefinition.selector;

    // Find children elements based on the map.
    const childrenElements = this.findChildrenElements(selector, node);

    this.validateElements(id, childrenElements, dependencyDefinition);

    if (childrenElements.length === 0) {
      return null;
    }

    if (childrenElements.length > 1) {
      throw new TooManyChildrenFoundError(
        `${this.constructor.name}: More than one element was found for the "${id}" dependency. Selector used: "${selector}".`,
      );
    }

    const childElement = childrenElements[0];

    return this.instantiateWrapletItem<T>(
      id,
      dependencyDefinition,
      dependencyMap,
      childElement,
    ) as WrapletDependencies<M>[T];
  }

  private instantiateWrapletItem<T extends keyof M>(
    id: Extract<T, string>,
    dependencyDefinition: WrapletDependencyDefinitionWithDefaults<M[T], M>,
    dependencyMap: MapWrapper<WrapletDependencyMapWithDefaults<M>>,
    node: Node,
  ): Wraplet | null {
    // Re-use existing wraplet.
    const existingWraplet = this.findExistingWraplet(id, node);
    if (existingWraplet) {
      return existingWraplet;
    }

    const wrapletClass = dependencyDefinition.Class;
    const creatorArgs: WrapletCreatorArgs<Node, WrapletDependencyMap> = {
      id: id,
      Class: wrapletClass,
      element: node,
      map: dependencyMap,
      initOptions: dependencyDefinition.coreOptions,
      args: dependencyDefinition.args,
    };

    creatorArgs.args = creatorArgs.args.map((arg) => {
      if (isArgCreator<Node, WrapletDependencyMap>(arg)) {
        return arg.createArg(creatorArgs);
      }
      return arg;
    });
    let wraplet: Wraplet | null = null;
    try {
      wraplet = this.wrapletCreator(creatorArgs, this.constructor as any);
    } catch (e) {
      if (e instanceof UnsupportedNodeTypeError) {
        if (!dependencyDefinition.required) {
          console.warn(
            `${e.message} Skipping instantiation of the "${id}" dependency.`,
          );
          return null;
        }
      }
      throw e;
    }
    this.prepareIndividualWraplet(id, wraplet);

    for (const listener of this.instantiatedDependencyListeners) {
      listener(wraplet as DependencyInstance<M>, id);
    }

    return wraplet;
  }

  private instantiateMultipleDependencies<T extends keyof M>(
    dependencyDefinition: WrapletDependencyDefinitionWithDefaults<M[T], M>,
    dependencyMap: MapWrapper<WrapletDependencyMapWithDefaults<M>>,
    node: ParentNode,
    id: Extract<T, string>,
  ): WrapletDependencies<M>[keyof WrapletDependencies<M>] {
    const selector = dependencyDefinition.selector;
    if (!selector) {
      return new DefaultWrapletSet() as WrapletDependencies<M>[keyof WrapletDependencies<M>];
    }

    // Find children elements based on the map.
    const childElements = this.findChildrenElements(selector, node);
    this.validateElements(id, childElements, dependencyDefinition);

    const items: WrapletSet =
      this.instantiatedDependencies && this.instantiatedDependencies[id]
        ? (this.instantiatedDependencies[id] as WrapletSet<Wraplet<N>>)
        : new DefaultWrapletSet<Wraplet<N>>();
    for (const childElement of childElements) {
      const existingWraplet = this.findExistingWraplet(id, childElement);
      if (existingWraplet) {
        continue;
      }
      const wraplet = this.instantiateWrapletItem(
        id,
        dependencyDefinition,
        dependencyMap,
        childElement,
      );
      if (wraplet) {
        items.add(wraplet);
      }
    }

    return items as WrapletDependencies<M>[keyof WrapletDependencies<M>];
  }

  public addDependencyDestroyedListener(
    callback: DependencyDestroyedListener<M, keyof M>,
  ): void {
    this.destroyedDependencyListeners.push(callback);
  }

  public addDependencyInstantiatedListener(
    callback: DependencyInstantiatedListener<M, keyof M>,
  ): void {
    this.instantiatedDependencyListeners.push(callback);
  }

  public setWrapletCreator(
    wrapletCreator: WrapletCreator<Node, WrapletDependencyMap>,
  ): void {
    this.wrapletCreator = wrapletCreator;
  }

  private prepareIndividualWraplet<K extends Extract<keyof M, string>>(
    id: K,
    wraplet: Wraplet,
  ) {
    const destroyListener: DestroyListener = (<K extends keyof M>(
      wraplet: DependencyInstance<M, K>,
    ) => {
      this.removeDependency(wraplet, id);

      for (const listener of this.destroyedDependencyListeners) {
        listener(wraplet, id);
      }
    }) as DestroyListener;
    // Listen for the dependency's destruction.
    wraplet.wraplet.addDestroyListener(destroyListener);
  }

  /**
   * This method removes from nodes references to this wraplet and its dependencies recursively.
   */
  public async destroy(): Promise<void> {
    if (this.statusWritable.isDestroyed) {
      throw new DependenciesAreAlreadyDestroyedError(
        "Dependencies are already destroyed.",
      );
    }
    this.statusWritable.isGettingDestroyed = true;

    if (this.statusWritable.isGettingInitialized) {
      // If we are still initializing, then postpone destruction until after
      // initialization is finished.
      // We are leaving this method, but with `isGettingDestroyed` set to true, so
      // the initialization process will know to return here after it will finish.
      return;
    }

    if (!this.statusWritable.isInitialized) {
      // If we are not initialized, then we have nothing to do here.
      this.statusWritable.isDestroyed = true;
      this.statusWritable.isGettingDestroyed = false;
      return;
    }

    // Remove listeners.
    for (const listener of this.listeners) {
      const node = listener.node;
      const eventName = listener.eventName;
      const callback = listener.callback;
      const options = listener.options;
      node.removeEventListener(eventName, callback, options);
    }

    this.listeners.length = 0;

    await this.destroyDependencies();

    this.statusWritable.isInitialized = false;
    this.statusWritable.isDestroyed = true;
    this.statusWritable.isGettingDestroyed = false;
  }

  private findChildrenElements<PN extends ParentNode>(
    selector: string | SelectorCallback<PN>,
    node: PN,
  ): Node[] {
    const defaultSelectorCallback = (
      selector: string,
      node: ParentNode,
    ): Node[] => {
      return Array.from(node.querySelectorAll(selector));
    };

    // Find children elements based on the map.
    return typeof selector === "string"
      ? defaultSelectorCallback(selector, node)
      : selector(node);
  }

  public addEventListener(
    node: Node,
    eventName: string,
    callback: EventListenerOrEventListenerObject,
    options?: AddEventListenerOptions | boolean,
  ) {
    this.listeners.push({ node, eventName, callback, options });
    node.addEventListener(eventName, callback, options);
  }

  public get dependencies(): WrapletDependencies<M> {
    if (!this.dependenciesAreInstantiated) {
      throw new DependenciesAreNotAvailableError(
        "Wraplet is not yet fully initialized. You can fetch partial dependencies with the 'instantiatedDependencies' property.",
      );
    }
    return this.instantiatedDependencies as WrapletDependencies<M>;
  }

  private removeDependency<K extends Extract<keyof M, string>>(
    wraplet: DependencyInstance<M, K>,
    id: K,
  ): void {
    if (isWrapletSet(this.instantiatedDependencies[id])) {
      if (!this.instantiatedDependencies[id].delete(wraplet)) {
        throw new InternalLogicError(
          "Internal logic error. Destroyed dependency couldn't be removed because it already doesn't exist.",
        );
      }
      return;
    }

    if (this.instantiatedDependencies[id] === null) {
      throw new InternalLogicError(
        "Internal logic error. Destroyed dependency couldn't be removed because it already doesn't exist.",
      );
    }

    // @ts-expect-error The type is unknown because we are dealing with a generic here.
    this.instantiatedDependencies[id] = null;

    if (this.map[id].required && !this.status.isGettingDestroyed) {
      throw new RequiredDependencyDestroyedError(
        "Required dependency has been destroyed.",
      );
    }
  }

  private validateMapItem(
    id: string,
    item: WrapletDependencyDefinitionWithDefaults<M[keyof M], M>,
  ): void {
    const selector = item.selector;
    const isRequired = item.required;
    if (!selector) {
      if (isRequired) {
        throw new MapError(
          `${this.constructor.name}: Dependency "${id}" cannot at the same be required and have no selector.`,
        );
      }
    }
  }

  private validateMapItemForNonParent(
    id: string,
    item: WrapletDependencyDefinitionWithDefaults<M[keyof M], M>,
  ): void {
    if (item.required) {
      throw new MapError(
        `Dependency "${id}" error: If the node provided cannot have children, there should be no required dependencies.`,
      );
    }
  }

  private validateElements(
    id: Extract<keyof M, string>,
    elements: Node[],
    mapItem: WrapletDependencyDefinitionWithDefaults<M[keyof M], M>,
  ): void {
    if (elements.length === 0 && mapItem.required) {
      throw new MissingRequiredDependencyError(
        `${this.constructor.name}: Couldn't find a node for the wraplet "${id}". Selector used: "${mapItem.selector}".`,
      );
    }
  }

  /**
   * Set up a proxy to check if dependencies have not been destroyed before fetching them.
   */
  private wrapDependencies(
    dependencies: WrapletDependencies<M>,
  ): WrapletDependencies<M> {
    return new Proxy(dependencies, {
      get: function get(target, name: string) {
        if (!(name in target)) {
          throw new Error(`Dependency '${name}' has not been found.`);
        }
        return target[name];
      },
    });
  }

  private defaultInitOptions(): CoreInitOptions<M> {
    return {
      dependencyInstantiatedListeners: [],
      dependencyDestroyedListeners: [],
    };
  }

  private processInitOptions(
    initOptionsPartial: Partial<CoreInitOptions<M>>,
  ): void {
    const initOptions: CoreInitOptions<M> = Object.assign(
      this.defaultInitOptions(),
      initOptionsPartial,
    );

    if (initOptions.dependencyInstantiatedListeners) {
      for (const listener of initOptions.dependencyInstantiatedListeners) {
        this.instantiatedDependencyListeners.push(listener);
      }
    }

    if (initOptions.dependencyDestroyedListeners) {
      for (const listener of initOptions.dependencyDestroyedListeners) {
        this.destroyedDependencyListeners.push(listener);
      }
    }
  }

  private async destroyDependencies(): Promise<void> {
    for (const [key, dependency] of Object.entries(this.dependencies)) {
      if (!dependency || !this.map[key]["destructible"]) {
        continue;
      }
      if (isWrapletSet(dependency)) {
        for (const item of dependency) {
          await item.wraplet.destroy();
        }
      } else {
        await dependency.wraplet.destroy();
      }
    }
  }
}
