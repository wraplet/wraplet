import { createOuterInitializeCallback } from "../../src/Wraplet/createOuterInitializeCallback";
import { StatusWritable } from "../../src/Wraplet/types/Status";

describe("createOuterInitializeCallback", () => {
  let status: StatusWritable = {
    isInitialized: false,
    isGettingInitialized: false,
    isDestroyed: false,
    isGettingDestroyed: false,
  };

  beforeEach(() => {
    status = {
      isInitialized: false,
      isGettingInitialized: false,
      isDestroyed: false,
      isGettingDestroyed: false,
    };
  });

  const mockWrapletApi = {
    wraplet: {},
  } as any;

  it("should call customInitializeLogic and complete initialization", async () => {
    const destroyCallback = jest.fn().mockResolvedValue(undefined);
    const customInitializeLogic = jest.fn().mockResolvedValue(undefined);

    const initializeCallback = createOuterInitializeCallback(
      {
        destroyCallback: destroyCallback,
        status: status,
        wraplet: mockWrapletApi,
      },
      customInitializeLogic,
    );

    await initializeCallback();

    expect(customInitializeLogic).toHaveBeenCalledTimes(1);
    expect(status.isInitialized).toBe(true);
  });

  it("should return early when already initialized", async () => {
    status.isInitialized = true;
    const destroyCallback = jest.fn().mockResolvedValue(undefined);
    const customInitializeLogic = jest.fn().mockResolvedValue(undefined);

    const initializeCallback = createOuterInitializeCallback(
      {
        destroyCallback: destroyCallback,
        status: status,
        wraplet: mockWrapletApi,
      },
      customInitializeLogic,
    );

    await initializeCallback();

    expect(customInitializeLogic).not.toHaveBeenCalled();
    expect(status.isGettingInitialized).toBe(false);
  });

  it("should work even without custom logic provided", async () => {
    const destroyCallback = jest.fn().mockResolvedValue(undefined);

    const initializeCallback = createOuterInitializeCallback({
      destroyCallback: destroyCallback,
      status: status,
      wraplet: mockWrapletApi,
    });

    await expect(initializeCallback).resolves.not.toThrow();
    expect(status.isInitialized).toBe(true);
  });
});
