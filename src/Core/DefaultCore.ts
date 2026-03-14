import { WrapletDependencies } from "../Wraplet/types/WrapletDependencies";
import { Nullable } from "../utils/types/Utils";
import {
  DependenciesAreNotAvailableError,
  TooManyChildrenFoundError,
  InternalLogicError,
  MapError,
  MissingRequiredDependencyError,
  RequiredDependencyDestroyedError,
  UnsupportedNodeTypeError,
  LifecycleError,
} from "../errors";
import { isWraplet, Wraplet } from "../Wraplet/types/Wraplet";
import {
  isWrapletDependencyMap,
  MultipleDependencyKeys,
  SingleDependencyKeys,
  WrapletDependencyMap,
  WrapletDependencyMapWithDefaults,
} from "../Wraplet/types/WrapletDependencyMap";
import { isParentNode } from "../NodeTreeManager/utils";
import { DependencyInstance } from "../Wraplet/types/DependencyInstance";
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
import { DependencyLifecycleAsyncListener } from "./types/DependencyLifecycleAsyncListener";
import { DependencyLifecycleListener } from "./types/DependencyLifecycleListener";
import { handleAsyncLifecycleResults } from "../utils/handleAsyncLifecycleResults";
import { AsyncResultsLifecycleData } from "../utils/types/AsyncResultsLifecycleData";

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
  private directDependencies: Partial<WrapletDependencies<M>> = {};
  private wrappedDependencies: Partial<WrapletDependencies<M>> = {};

  private destroyedDependencyListeners: DependencyLifecycleAsyncListener<
    M,
    keyof M
  >[] = [];
  private instantiatedDependencyListeners: DependencyLifecycleListener<
    M,
    keyof M
  >[] = [];
  private initializedDependencyListeners: DependencyLifecycleAsyncListener<
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
    this.wrappedDependencies = {};
  }

  /**
   * Initialize core.
   *
   * We couldn't put this step in the constructor, because during initialization some wraplet
   * processing occurs (instantiate dependency listeners) that needs access to the Core,
   * so the Core has to exist already.
   */
  public async initializeDependencies() {
    if (this.status.isInitialized) {
      throw new LifecycleError("Dependencies are already initialized.");
    }

    this.statusWritable.isGettingInitialized = true;

    const results = await Promise.allSettled(
      Object.entries(this.wrappedDependencies).map(async ([id, dependency]) => {
        if (!dependency) return;

        const wraplets: Wraplet[] = isWrapletSet(dependency)
          ? Array.from(dependency)
          : [dependency];

        const results = await Promise.allSettled(
          wraplets.map(async (wraplet) => {
            if (
              wraplet.wraplet.status.isInitialized ||
              wraplet.wraplet.status.isGettingInitialized
            ) {
              return;
            }

            await wraplet.wraplet.initialize();

            const listenerResults = await Promise.allSettled(
              this.initializedDependencyListeners.map(async (listener) => {
                await listener(wraplet as DependencyInstance<M, keyof M>, id);
              }),
            );

            handleAsyncLifecycleResults(
              `core's dependency "${id}" initialize listener.`,
              [{ child: id, results: listenerResults }],
            );
          }),
        );
        handleAsyncLifecycleResults(
          `core's dependency "${id}" initialize callback.`,
          [{ child: id, results: results }],
        );
      }),
    );

    handleAsyncLifecycleResults(`core: initialize error.`, [
      { results: results },
    ]);

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
    if (this.dependenciesAreInstantiated) {
      throw new LifecycleError("Dependencies are already instantiated.");
    }

    const dependencies: Partial<Nullable<WrapletDependencies<M>>> =
      this.directDependencies;
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
        if (!dependencies[id]) {
          dependencies[id] = new DefaultWrapletSet() as any;
        }
        const currentDependencies = dependencies[id] as WrapletSet;

        // We can assert as much because items
        const instantiatedDependencies = this.instantiateMultipleDependencies(
          dependencyDefinition,
          mapWrapper,
          this.node,
          id,
        );

        // Add new items to the current wraplet set.
        for (const item of instantiatedDependencies) {
          currentDependencies.add(item);
        }

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
      this.directDependencies = dependencies as WrapletDependencies<M>;
      this.wrappedDependencies = this.wrapDependencies(
        this.directDependencies as WrapletDependencies<M>,
      );
      this.dependenciesAreInstantiated = true;
    }
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
    if (this.directDependencies === undefined || !this.directDependencies[id]) {
      return null;
    }
    const existingDependency = this.directDependencies[id];
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
    } else {
      if (!isWraplet(existingDependency)) {
        throw new InternalLogicError(
          "Internal logic error. Expected a Wraplet.",
        );
      }
      let isSame = false;
      existingDependency.wraplet.accessNode((node) => {
        if (node === childElement) {
          isSame = true;
        }
      });

      if (!isSame) {
        return null;
      }
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
      return this.directDependencies[id] || null;
    }

    if (!this.dependenciesAreInstantiated && this.directDependencies[id]) {
      throw new MapError(
        `It's not possible to provide a single-type dependency manually and use selector at the same time.`,
      );
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
  ): WrapletSet {
    const selector = dependencyDefinition.selector;
    if (!selector) {
      return new DefaultWrapletSet<Wraplet<N>>();
    }

    // Find children elements based on the map.
    const childElements = this.findChildrenElements(selector, node);
    this.validateElements(id, childElements, dependencyDefinition);

    const items: WrapletSet = new DefaultWrapletSet<Wraplet<N>>();
    for (const childElement of childElements) {
      let wraplet = this.findExistingWraplet(id, childElement);
      if (!wraplet) {
        wraplet = this.instantiateWrapletItem(
          id,
          dependencyDefinition,
          dependencyMap,
          childElement,
        );
      }

      if (wraplet) {
        items.add(wraplet);
      }
    }

    return items;
  }

  public addDependencyDestroyedListener(
    callback: DependencyLifecycleAsyncListener<M, keyof M>,
  ): void {
    this.destroyedDependencyListeners.push(callback);
  }

  public addDependencyInstantiatedListener(
    callback: DependencyLifecycleListener<M, keyof M>,
  ): void {
    this.instantiatedDependencyListeners.push(callback);
  }

  public addDependencyInitializedListener(
    callback: DependencyLifecycleAsyncListener<M, keyof M>,
  ): void {
    this.initializedDependencyListeners.push(callback);
  }

  public setWrapletCreator(
    wrapletCreator: WrapletCreator<Node, WrapletDependencyMap>,
  ): void {
    this.wrapletCreator = wrapletCreator;
  }

  public setExistingInstance<
    K extends SingleDependencyKeys<M> & Extract<keyof M, string>,
  >(id: K, wraplet: DependencyInstance<M, K>): void {
    const map = this.map;

    if (map[id].multiple) {
      throw new MapError(
        `This method can only be used to set a single-value dependency.`,
      );
    }

    if (this.directDependencies[id]) {
      throw new MapError(`Dependency is already set.`);
    }

    if (!isWraplet(wraplet)) {
      throw new MapError(`Provided instance is not a valid wraplet.`);
    }

    this.prepareIndividualWraplet(id, wraplet);

    this.directDependencies[id] = wraplet as any;
  }

  public addExistingInstance<
    K extends MultipleDependencyKeys<M> & Extract<keyof M, string>,
  >(id: K, wraplet: DependencyInstance<M, K>): void {
    const map = this.map;

    if (!map[id].multiple) {
      throw new MapError(
        `This method can only be used to set a multi-value dependency.`,
      );
    }

    this.prepareIndividualWraplet(id, wraplet);

    const items: WrapletSet =
      this.directDependencies && this.directDependencies[id]
        ? (this.directDependencies[id] as WrapletSet<Wraplet<N>>)
        : new DefaultWrapletSet<Wraplet<N>>();

    items.add(wraplet);

    this.directDependencies[id] = items as any;
  }

  private prepareIndividualWraplet<K extends Extract<keyof M, string>>(
    id: K,
    wraplet: Wraplet,
  ) {
    // Listen for the dependency's destruction.
    wraplet.wraplet.addDestroyListener(
      this.createDependencyDestroyListener(id),
    );
  }

  private createDependencyDestroyListener<K extends Extract<keyof M, string>>(
    id: K,
  ): DestroyListener {
    return (async (w: DependencyInstance<M, K>) => {
      this.removeDependency(w, id);
      const results = await Promise.allSettled(
        this.destroyedDependencyListeners.map((listener) => listener(w, id)),
      );
      handleAsyncLifecycleResults(
        `core's dependency "${id}" destroy listener error.`,
        [{ child: id, results: results }],
      );
    }) as DestroyListener;
  }

  /**
   * This method removes from nodes references to this wraplet and its dependencies recursively.
   */
  public async destroy(): Promise<void> {
    if (this.statusWritable.isDestroyed) {
      throw new LifecycleError("Dependencies are already destroyed.");
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
        "Wraplet is not yet fully initialized.",
      );
    }
    return this.wrappedDependencies as WrapletDependencies<M>;
  }

  private removeDependency<K extends Extract<keyof M, string>>(
    wraplet: DependencyInstance<M, K>,
    id: K,
  ): void {
    if (isWrapletSet(this.directDependencies[id])) {
      this.directDependencies[id].delete(wraplet);
      return;
    }

    // Only nullify the dependency if the current instance is the same one.
    // If it's not, then we don't care as there is no reference either way.
    if (this.directDependencies[id] === wraplet) {
      // @ts-expect-error The type is unknown because we are dealing with a generic here.
      this.directDependencies[id] = null;
    }

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
    if (
      !selector &&
      isRequired &&
      (!this.directDependencies[id] ||
        (isWrapletSet(this.directDependencies[id]) &&
          this.directDependencies[id].size === 0))
    ) {
      throw new MapError(
        `${this.constructor.name}: Dependency "${id}" cannot at the same be required, have no selector, and be not provided otherwise.`,
      );
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
      get: (target, name: string) => {
        if (!(name in target)) {
          throw new Error(`Dependency '${name}' has not been found.`);
        }
        return target[name];
      },
      set: () => {
        throw new Error(
          `Dependencies cannot be set directly. Use the 'setExistingInstance' or 'addExistingInstance' methods instead.`,
        );
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

    if (initOptions.dependencyInitializedListeners) {
      for (const listener of initOptions.dependencyInitializedListeners) {
        this.initializedDependencyListeners.push(listener);
      }
    }

    if (initOptions.dependencyDestroyedListeners) {
      for (const listener of initOptions.dependencyDestroyedListeners) {
        this.destroyedDependencyListeners.push(listener);
      }
    }
  }

  private async destroyDependencies(): Promise<void> {
    const allResults: AsyncResultsLifecycleData[] = [];

    for (const [key, dependency] of Object.entries(this.directDependencies)) {
      if (!dependency || !this.map[key]["destructible"]) {
        continue;
      }

      const wraplets: Wraplet[] = [];

      if (isWrapletSet(dependency)) {
        for (const item of dependency) {
          wraplets.push(item);
        }
      } else {
        wraplets.push(dependency);
      }

      // Run all destroy callbacks in paralell.
      const results = await Promise.allSettled(
        wraplets.map(async (wraplet) => {
          await wraplet.wraplet.destroy();
        }),
      );

      allResults.push({ child: key, results });
    }

    handleAsyncLifecycleResults(
      `core's one of the destroy listeners.`,
      allResults,
    );
  }
}
