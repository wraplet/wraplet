import { createDefaultDestroyCallback } from "../../src/Wraplet/createDefaultDestroyCallback";
import { Core } from "../../src/Core/types/Core";
import { Wraplet } from "../../src/Wraplet/types/Wraplet";

describe("createDefaultDestroyCallback", () => {
  it("should throw an error if status is not provided and not available on this", async () => {
    const mockCore = {} as Core<any, any>;
    const mockWraplet = {} as Wraplet<any>;
    const destroyListeners: any[] = [];

    const destroyCallback = createDefaultDestroyCallback(
      mockCore,
      mockWraplet,
      destroyListeners,
    );

    await expect(destroyCallback()).rejects.toThrow(
      "Cannot destroy without status available.",
    );
  });
});
