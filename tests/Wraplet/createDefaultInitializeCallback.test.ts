import { createDefaultInitializeCallback } from "../../src/Wraplet/createDefaultInitializeCallback";
import { Core } from "../../src/Core/types/Core";

describe("createDefaultInitializeCallback", () => {
  it("should throw an error if status is not provided and not available on this", async () => {
    const mockCore = {} as Core<any, any>;
    const destroyCallback = jest.fn().mockResolvedValue(undefined);

    const initializeCallback = createDefaultInitializeCallback(
      mockCore,
      destroyCallback,
    );

    await expect(initializeCallback()).rejects.toThrow(
      "Cannot initialize without status available.",
    );
  });

  it("should call customInitializeLogic and complete initialization", async () => {
    const mockCore = {
      status: {
        isInitialized: false,
        isGettingInitialized: false,
      },
      initializeChildren: jest.fn().mockResolvedValue(undefined),
    } as any;
    const status = {
      isInitialized: false,
      isGettingInitialized: false,
      isDestroyed: false,
      isGettingDestroyed: false,
    } as any;
    const destroyCallback = jest.fn().mockResolvedValue(undefined);
    const customInitializeLogic = jest.fn().mockResolvedValue(undefined);

    const initializeCallback = createDefaultInitializeCallback(
      mockCore,
      destroyCallback,
      customInitializeLogic,
      status,
    );

    await initializeCallback();

    expect(customInitializeLogic).toHaveBeenCalledTimes(1);
    expect(status.isInitialized).toBe(true);
  });
});
