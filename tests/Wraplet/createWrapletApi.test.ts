import { WrapletApi, WrapletSymbol } from "../../src";
import { createWrapletApi } from "../../src/Wraplet/createWrapletApi";
import { Wraplet } from "../../src/Wraplet/types/Wraplet";

describe("createWrapletApi", () => {
  class MockWraplet implements Wraplet {
    wraplet: WrapletApi;
    [WrapletSymbol]: true = true;

    constructor() {
      this.wraplet = jest.fn().mockImplementation() as any;
    }
  }

  const mockWraplet = new MockWraplet();

  it("should handle initialize without initializeCallback", async () => {
    const mockNode = document.createElement("div");

    const api = createWrapletApi({
      node: mockNode,
      wraplet: mockWraplet,
    });

    await api.initialize();

    expect(api.status.isInitialized).toBe(true);
  });

  it("should handle destroy without destroyCallback", async () => {
    const mockNode = document.createElement("div");

    const api = createWrapletApi({
      node: mockNode,
      wraplet: mockWraplet,
    });

    await api.initialize();
    await api.destroy();

    expect(api.status.isDestroyed).toBe(true);
  });

  it("should handle initialize with initializeCallback", async () => {
    const mockNode = document.createElement("div");
    const initializeCallback = jest.fn();

    const api = createWrapletApi({
      node: mockNode,
      wraplet: mockWraplet,
      initializeCallback,
    });

    await api.initialize();

    expect(initializeCallback).toHaveBeenCalled();
    expect(api.status.isInitialized).toBe(true);
  });

  it("should handle destroy with destroyCallback", async () => {
    const mockNode = document.createElement("div");
    const destroyCallback = jest.fn();

    const api = createWrapletApi({
      node: mockNode,
      wraplet: mockWraplet,
      destroyCallback,
    });

    await api.initialize();
    await api.destroy();

    expect(destroyCallback).toHaveBeenCalled();
    // We make sure that node accessors are empty after destroying.
    expect(api.__nodeAccessors).toHaveLength(0);
    expect(api.status.isDestroyed).toBe(true);
  });

  it("should cleanup private arrays", async () => {
    const mockNode = document.createElement("div");
    const accessNodeCallback = jest.fn();
    const destroyListenerCallback = jest.fn();

    const api = createWrapletApi({
      node: mockNode,
      wraplet: mockWraplet,
    });

    await api.initialize();

    api.accessNode(accessNodeCallback);
    expect(api.__nodeAccessors).toHaveLength(1);

    api.addDestroyListener(destroyListenerCallback);
    expect(api.__destroyListeners).toHaveLength(1);

    await api.destroy();

    expect(api.__nodeAccessors).toHaveLength(0);
    expect(api.__destroyListeners).toHaveLength(0);
  });

  describe("createWrapletApi arguments validation", () => {
    it("should throw when wraplet is not a valid wraplet instance", () => {
      expect(() =>
        createWrapletApi({
          node: document.createElement("div"),
          wraplet: {} as any,
        }),
      ).toThrow("Correct wraplet instance has to be provided.");
    });

    it("should throw when node is not a valid Node instance", () => {
      expect(() =>
        createWrapletApi({
          node: "not-a-node" as any,
          wraplet: mockWraplet,
        }),
      ).toThrow("Correct node has to be provided.");
    });

    it("should throw when initializeCallback is not a function", () => {
      expect(() =>
        createWrapletApi({
          node: document.createElement("div"),
          wraplet: mockWraplet,
          initializeCallback: "not-a-function" as any,
        }),
      ).toThrow("initializeCallback has to be a function.");
    });

    it("should throw when destroyCallback is not a function", () => {
      expect(() =>
        createWrapletApi({
          node: document.createElement("div"),
          wraplet: mockWraplet,
          destroyCallback: "not-a-function" as any,
        }),
      ).toThrow("destroyCallback has to be a function.");
    });
  });
});
