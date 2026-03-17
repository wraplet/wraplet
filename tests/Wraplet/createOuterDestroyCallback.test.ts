import { createOuterDestroyCallback } from "../../src/Wraplet/createOuterDestroyCallback";
import { Wraplet } from "../../src/Wraplet/types/Wraplet";
import type { Status } from "../../src/Wraplet/types/Status";

describe("createOuterDestroyCallback", () => {
  it("should clean up __nodeAccessors during destroy", async () => {
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

    const destroyCallback = createOuterDestroyCallback({
      wraplet: mockWraplet,
      destroyListeners: destroyListeners,
      status: status,
    }).bind(context);

    await destroyCallback();
    expect(context.__nodeAccessors.length).toBe(0);
  });

  it("should handle destroy when __nodeAccessors is not an array", async () => {
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

    const destroyCallback = createOuterDestroyCallback({
      wraplet: mockWraplet,
      destroyListeners: destroyListeners,
      status: status,
    }).bind(context);

    await destroyCallback();
    expect(context.__nodeAccessors).toBe("not-an-array");
  });
});
