import {
  mergeWirings,
  wireCallback,
} from "../../src/Wraplet/composeWrapletApi";

describe("mergeWrapletApiConfig", () => {
  it("should merge configs correctly", async () => {
    const initCallback1 = jest.fn();
    const initCallback2 = jest.fn();
    const destroyCallback1 = jest.fn();
    const destroyCallback2 = jest.fn();

    const composedConfig = mergeWirings([
      {
        initializeCallback: initCallback1,
        destroyCallback: destroyCallback1,
      },
      {
        initializeCallback: initCallback2,
        destroyCallback: destroyCallback2,
      },
    ]);

    await composedConfig.initializeCallback?.();
    expect(initCallback1).toHaveBeenCalledTimes(1);
    expect(initCallback2).toHaveBeenCalledTimes(1);

    await composedConfig.destroyCallback?.();
    expect(destroyCallback1).toHaveBeenCalledTimes(1);
    expect(destroyCallback2).toHaveBeenCalledTimes(1);
  });

  it("should run initilization callbacks in the wiring order and destruction callbacks in reverse", async () => {
    const calls: string[] = [];

    const composedConfig = mergeWirings([
      {
        initializeCallback: async () => {
          calls.push("init-1");
        },
      },
      {
        initializeCallback: async () => {
          calls.push("init-2");
        },
      },
      {
        destroyCallback: async () => {
          calls.push("destroy-1");
        },
      },
      {
        destroyCallback: async () => {
          calls.push("destroy-2");
        },
      },
    ]);

    await composedConfig.initializeCallback?.();
    await composedConfig.destroyCallback?.();

    expect(calls).toEqual(["init-1", "init-2", "destroy-2", "destroy-1"]);
  });
});

describe("wireCallback", () => {
  it("creates a wiring with the given initialize callback", async () => {
    const cb = jest.fn();
    const wiring = wireCallback("initializeCallback", cb);
    await wiring.initializeCallback?.();
    expect(cb).toHaveBeenCalledTimes(1);
    expect(wiring.destroyCallback).toBeUndefined();
  });

  it("creates a wiring with the given destroy callback", async () => {
    const cb = jest.fn();
    const wiring = wireCallback("destroyCallback", cb);
    await wiring.destroyCallback?.();
    expect(cb).toHaveBeenCalledTimes(1);
    expect(wiring.initializeCallback).toBeUndefined();
  });
});
