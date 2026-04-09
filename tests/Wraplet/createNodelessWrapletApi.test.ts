import { createDependencyApi } from "../../src/Wraplet/createDependencyApi";
import {
  DependencySymbol,
  Wraplet,
  WrapletSymbol,
} from "../../src/Wraplet/types/Wraplet";
import { WrapletApi } from "../../src";

describe("createDependencyApi", () => {
  class MockWraplet implements Wraplet {
    wraplet: WrapletApi;
    [WrapletSymbol]: true = true;

    constructor() {
      this.wraplet = jest.fn().mockImplementation() as any;
    }
  }

  const mockWraplet = new MockWraplet();

  it("destroys without error when no destroyCallback is provided", async () => {
    const mockWraplet = { [DependencySymbol]: true } as any;

    const api = createDependencyApi({
      wraplet: mockWraplet,
    });

    await api.initialize();
    await expect(api.destroy).resolves.not.toThrow();
    expect(api.status.isDestroyed).toBe(true);
  });

  describe("createDependencyApi arguments validation", () => {
    it("should throw when wraplet is not a valid wraplet instance", () => {
      expect(() =>
        createDependencyApi({
          wraplet: {} as any,
        }),
      ).toThrow("Correct wraplet instance has to be provided.");
    });

    it("should throw when initializeCallback is not a function", () => {
      expect(() =>
        createDependencyApi({
          wraplet: mockWraplet,
          initializeCallback: "not-a-function" as any,
        }),
      ).toThrow("initializeCallback has to be a function.");
    });

    it("should throw when destroyCallback is not a function", () => {
      expect(() =>
        createDependencyApi({
          wraplet: mockWraplet,
          destroyCallback: "not-a-function" as any,
        }),
      ).toThrow("destroyCallback has to be a function.");
    });
  });
});
