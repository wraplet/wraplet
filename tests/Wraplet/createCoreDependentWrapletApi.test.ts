import { createCoreDependentWrapletApi } from "../../src/Wraplet/createCoreDependentWrapletApi";
import { Core, CoreSymbol } from "../../src/Core/types/Core";
import { Wraplet, WrapletSymbol } from "../../src/Wraplet/types/Wraplet";
import { LifecycleError, Status } from "../../src";

describe("createCoreDependentWrapletApi", () => {
  let mockCore: jest.Mocked<Core<any, any>>;
  let mockWraplet: Wraplet<any>;
  let node: HTMLElement;

  beforeEach(() => {
    node = document.createElement("div");
    mockCore = {
      [CoreSymbol]: true,
      status: {} as Status,
      map: {},
      node: node,
      initializeDependencies: jest.fn().mockResolvedValue(undefined),
      instantiateDependencies: jest.fn(),
      addDependencyDestroyedListener: jest.fn(),
      addDependencyInstantiatedListener: jest.fn(),
      addDependencyInitializedListener: jest.fn(),
      destroy: jest.fn().mockResolvedValue(undefined),
      addEventListener: jest.fn(),
      getChildrenDependencies: jest.fn().mockReturnValue([]),
      setWrapletCreator: jest.fn(),
      setExistingInstance: jest.fn(),
      addExistingInstance: jest.fn(),
      dependencies: {},
    } satisfies Core;

    mockWraplet = {
      [WrapletSymbol]: true,
      wraplet: {} as any,
    };
  });

  it("should initialize correctly", async () => {
    const api = createCoreDependentWrapletApi({
      core: mockCore,
      wraplet: mockWraplet,
    });

    expect(api.status.isInitialized).toBe(false);
    expect(api.status.isGettingInitialized).toBe(false);

    const initPromise = api.initialize();
    expect(api.status.isGettingInitialized).toBe(true);

    await initPromise;

    expect(api.status.isInitialized).toBe(true);
    expect(api.status.isGettingInitialized).toBe(false);
    expect(mockCore.initializeDependencies).toHaveBeenCalledTimes(1);
  });

  it("should not initialize twice", async () => {
    const api = createCoreDependentWrapletApi({
      core: mockCore,
      wraplet: mockWraplet,
    });

    await api.initialize();
    await api.initialize();

    expect(mockCore.initializeDependencies).toHaveBeenCalledTimes(1);
  });

  it("should destroy correctly", async () => {
    const api = createCoreDependentWrapletApi({
      core: mockCore,
      wraplet: mockWraplet,
    });

    await api.initialize();

    expect(api.status.isDestroyed).toBe(false);

    await api.destroy();

    expect(api.status.isDestroyed).toBe(true);
    expect(mockCore.destroy).toHaveBeenCalledTimes(1);
  });

  it("should throw exception if destruction was invoked before initialization", async () => {
    const api = createCoreDependentWrapletApi({
      core: mockCore,
      wraplet: mockWraplet,
    });

    const func = async () => {
      await api.destroy();
    };

    await expect(func).rejects.toThrow(LifecycleError);

    // Don't run destroy methods when destroying before initializing.
    expect(mockCore.destroy).not.toHaveBeenCalled();
  });

  it("should postpone destruction if currently initializing", async () => {
    const api = createCoreDependentWrapletApi({
      core: mockCore,
      wraplet: mockWraplet,
    });

    const initPromise = api.initialize();
    expect(api.status.isGettingInitialized).toBe(true);

    const destroyPromise = api.destroy();
    expect(api.status.isGettingDestroyed).toBe(true);
    expect(api.status.isDestroyed).toBe(false);

    await initPromise;
    await destroyPromise;

    expect(api.status.isInitialized).toBe(false);
    expect(api.status.isDestroyed).toBe(true);
    expect(mockCore.destroy).toHaveBeenCalledTimes(1);
  });

  it("should call destroy listeners", async () => {
    const api = createCoreDependentWrapletApi({
      core: mockCore,
      wraplet: mockWraplet,
    });

    const listener = jest.fn();
    api.addDestroyListener(listener);

    await api.initialize();
    await api.destroy();

    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith(mockWraplet);
  });

  it("should handle accessNode and __nodeAccessors", () => {
    const api = createCoreDependentWrapletApi({
      core: mockCore,
      wraplet: mockWraplet,
    });

    const callback = jest.fn();
    api.accessNode(callback);

    expect(callback).toHaveBeenCalledWith(node);
    expect(api.__nodeAccessors).toContain(callback);
  });

  it("should return node tree children from core", () => {
    const childWraplet = {} as Wraplet;
    mockCore.getChildrenDependencies.mockReturnValue([childWraplet]);

    const api = createCoreDependentWrapletApi({
      core: mockCore,
      wraplet: mockWraplet,
    });

    expect(api.getChildrenDependencies()).toEqual([childWraplet]);
  });
});
