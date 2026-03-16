import { createDefaultDestroyCallback } from "../../src/Wraplet/createDefaultDestroyCallback";
import { Core } from "../../src/Core/types/Core";
import { Wraplet } from "../../src/Wraplet/types/Wraplet";
import type { Status } from "../../src/Wraplet/types/Status";

describe("createDefaultDestroyCallback", () => {
  it("should throw an error if status is not provided and not available on this", async () => {
    const mockCore = {} as Core<any, any>;
    const mockWraplet = {} as Wraplet<any>;
    const destroyListeners: any[] = [];

    const destroyCallback = createDefaultDestroyCallback({
      core: mockCore,
      wraplet: mockWraplet,
      destroyListeners: destroyListeners,
    });

    await expect(destroyCallback()).rejects.toThrow(
      "Cannot destroy without status available.",
    );
  });

  it("should clean up __nodeAccessors during destroy", async () => {
    const node = document.createElement("div");
    const mockCore = {
      destroy: jest.fn(),
      node: node,
    } as unknown as Core<any, any>;
    const mockWraplet = {} as Wraplet<any>;
    const destroyListeners: any[] = [];
    const status: Status = {
      isGettingInitialized: false,
      isInitialized: true,
      isDestroyed: false,
      isGettingDestroyed: false,
    };

    const context = {
      __nodeAccessors: [jest.fn(), jest.fn()],
      status: status,
    };

    const destroyCallback = createDefaultDestroyCallback({
      core: mockCore,
      wraplet: mockWraplet,
      destroyListeners: destroyListeners,
      status: status,
    }).bind(context);

    await destroyCallback();
    expect(context.__nodeAccessors.length).toBe(0);
  });

  it("should handle destroy when __nodeAccessors is not an array", async () => {
    const node = document.createElement("div");
    const mockCore = {
      destroy: jest.fn(),
      node: node,
    } as unknown as Core<any, any>;
    const mockWraplet = {} as Wraplet<any>;
    const destroyListeners: any[] = [];
    const status: Status = {
      isGettingInitialized: false,
      isInitialized: true,
      isDestroyed: false,
      isGettingDestroyed: false,
    };

    const context = {
      __nodeAccessors: "not-an-array",
      status: status,
    };

    const destroyCallback = createDefaultDestroyCallback({
      core: mockCore,
      wraplet: mockWraplet,
      destroyListeners: destroyListeners,
      status: status,
    }).bind(context);

    await destroyCallback();
    expect(context.__nodeAccessors).toBe("not-an-array");
  });
});
