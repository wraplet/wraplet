import { createWrapletApi } from "../../src/Wraplet/createWrapletApi";
import { Wraplet } from "../../src/Wraplet/types/Wraplet";

describe("createWrapletApi", () => {
  it("should handle initialize without initializeCallback", async () => {
    const mockNode = document.createElement("div");
    const mockWraplet = {} as Wraplet<HTMLDivElement>;

    const api = createWrapletApi({
      node: mockNode,
      wraplet: mockWraplet,
    });

    await api.initialize();

    expect(api.status.isInitialized).toBe(true);
  });

  it("should handle destroy without destroyCallback", async () => {
    const mockNode = document.createElement("div");
    const mockWraplet = {} as Wraplet<HTMLDivElement>;

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
    const mockWraplet = {} as Wraplet<HTMLDivElement>;
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
    const mockWraplet = {} as Wraplet<HTMLDivElement>;
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
    const mockWraplet = {} as Wraplet<HTMLDivElement>;
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
});
