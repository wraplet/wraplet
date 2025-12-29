import { createRichWrapletApi } from "../../src/Wraplet/createRichWrapletApi";
import { Core, CoreSymbol } from "../../src/Core/types/Core";
import { Wraplet, WrapletSymbol } from "../../src/Wraplet/types/Wraplet";
import { defaultGroupableAttribute } from "../../src/types/Groupable";
import { Status } from "../../src";

describe("createWrapletApi", () => {
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
      initializeChildren: jest.fn().mockResolvedValue(undefined),
      instantiateChildren: jest.fn(),
      syncChildren: jest.fn(),
      addDestroyChildListener: jest.fn(),
      addInstantiateChildListener: jest.fn(),
      destroy: jest.fn().mockResolvedValue(undefined),
      addEventListener: jest.fn(),
      getNodeTreeChildren: jest.fn().mockReturnValue([]),
      setWrapletCreator: jest.fn(),
      children: {},
    } as any;

    mockWraplet = {
      [WrapletSymbol]: true,
      wraplet: {} as any,
    };
  });

  it("should initialize correctly", async () => {
    const api = createRichWrapletApi({
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
    expect(mockCore.initializeChildren).toHaveBeenCalledTimes(1);
  });

  it("should not initialize twice", async () => {
    const api = createRichWrapletApi({
      core: mockCore,
      wraplet: mockWraplet,
    });

    await api.initialize();
    await api.initialize();

    expect(mockCore.initializeChildren).toHaveBeenCalledTimes(1);
  });

  it("should destroy correctly", async () => {
    const api = createRichWrapletApi({
      core: mockCore,
      wraplet: mockWraplet,
    });

    await api.initialize();

    expect(api.status.isDestroyed).toBe(false);

    await api.destroy();

    expect(api.status.isDestroyed).toBe(true);
    expect(mockCore.destroy).toHaveBeenCalledTimes(1);
  });

  it("should handle destruction before initialization", async () => {
    const api = createRichWrapletApi({
      core: mockCore,
      wraplet: mockWraplet,
    });

    // Not initialized yet
    await api.destroy();

    expect(api.status.isDestroyed).toBe(true);

    // Don't run destroy methods when destroying before initializing.
    expect(mockCore.destroy).not.toHaveBeenCalled();
  });

  it("should postpone destruction if currently initializing", async () => {
    const api = createRichWrapletApi({
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
    const api = createRichWrapletApi({
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

  it("should use custom initialize and destroy callbacks", async () => {
    const customInit = jest.fn();
    const customDestroy = jest.fn();

    const api = createRichWrapletApi({
      core: mockCore,
      wraplet: mockWraplet,
      initializeCallback: customInit,
      destroyCallback: customDestroy,
    });

    await api.initialize();
    expect(customInit).toHaveBeenCalledTimes(1);
    expect(mockCore.initializeChildren).toHaveBeenCalledTimes(1);

    await api.destroy();
    expect(customDestroy).toHaveBeenCalledTimes(1);
  });

  it("should handle accessNode and __nodeAccessors", () => {
    const api = createRichWrapletApi({
      core: mockCore,
      wraplet: mockWraplet,
    });

    const callback = jest.fn();
    api.accessNode(callback);

    expect(callback).toHaveBeenCalledWith(node);
    expect(api.__nodeAccessors).toContain(callback);
  });

  it("should handle groups correctly with default extractor", () => {
    node.setAttribute(defaultGroupableAttribute, "group1,group2");
    const api = createRichWrapletApi({
      core: mockCore,
      wraplet: mockWraplet,
    });

    expect(api.getGroups()).toEqual(["group1", "group2"]);
  });

  it("should handle groups correctly with custom extractor", () => {
    const api = createRichWrapletApi({
      core: mockCore,
      wraplet: mockWraplet,
    });

    const customExtractor = jest.fn().mockReturnValue(["custom"]);
    api.setGroupsExtractor(customExtractor);

    expect(api.getGroups()).toEqual(["custom"]);
    expect(customExtractor).toHaveBeenCalledWith(node);
  });

  it("should return node tree children from core", () => {
    const childWraplet = {} as Wraplet;
    mockCore.getNodeTreeChildren.mockReturnValue([childWraplet]);

    const api = createRichWrapletApi({
      core: mockCore,
      wraplet: mockWraplet,
    });

    expect(api.getNodeTreeChildren()).toEqual([childWraplet]);
  });
});
