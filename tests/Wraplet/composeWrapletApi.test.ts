import {
  composeWrapletApi,
  lazyWiring,
  mergeWirings,
  wireCallback,
} from "../../src/Wraplet/composeWrapletApi";
import { wire } from "../../src/Wraplet/wire";
import { createWrapletApi } from "../../src/Wraplet/createWrapletApi";
import { Wraplet } from "../../src/Wraplet/types/Wraplet";

describe("mergeWrapletApiConfig", () => {
  it("should merge configs correctly", async () => {
    const wraplet = jest.fn() as unknown as Wraplet;
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

    await composedConfig.initializeCallback?.(wraplet);
    expect(initCallback1).toHaveBeenCalledTimes(1);
    expect(initCallback2).toHaveBeenCalledTimes(1);

    await composedConfig.destroyCallback?.(wraplet);
    expect(destroyCallback1).toHaveBeenCalledTimes(1);
    expect(destroyCallback2).toHaveBeenCalledTimes(1);
  });

  it("should run initilization callbacks in the wiring order and destruction callbacks in reverse", async () => {
    const wraplet = jest.fn() as unknown as Wraplet;
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

    await composedConfig.initializeCallback?.(wraplet);
    await composedConfig.destroyCallback?.(wraplet);

    expect(calls).toEqual(["init-1", "init-2", "destroy-2", "destroy-1"]);
  });
});

describe("wireCallback", () => {
  it("creates a wiring with the given initialize callback", async () => {
    const wraplet = jest.fn() as unknown as Wraplet;
    const cb = jest.fn();
    const wiring = wireCallback("initializeCallback", cb);
    await wiring.initializeCallback?.(wraplet);
    expect(cb).toHaveBeenCalledTimes(1);
    expect(wiring.destroyCallback).toBeUndefined();
  });

  it("creates a wiring with the given destroy callback", async () => {
    const wraplet = jest.fn() as unknown as Wraplet;
    const cb = jest.fn();
    const wiring = wireCallback("destroyCallback", cb);
    await wiring.destroyCallback?.(wraplet);
    expect(cb).toHaveBeenCalledTimes(1);
    expect(wiring.initializeCallback).toBeUndefined();
  });
});

describe("lazyWiring", () => {
  it("returns a wiring with both initialize and destroy callbacks", () => {
    const wiring = lazyWiring(() => ({}));
    expect(typeof wiring.initializeCallback).toBe("function");
    expect(typeof wiring.destroyCallback).toBe("function");
  });

  it("does not evaluate the callback until the wiring is used", () => {
    const callback = jest.fn(() => ({}));
    lazyWiring(callback);
    expect(callback).not.toHaveBeenCalled();
  });

  it("evaluates the callback when the initialize callback is used", async () => {
    const wraplet = jest.fn() as unknown as Wraplet;
    const callback = jest.fn(() => ({}));
    const wiring = lazyWiring(callback);

    expect(callback).not.toHaveBeenCalled();
    await wiring.initializeCallback?.(wraplet);
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it("evaluates the callback when the destroy callback is used", async () => {
    const wraplet = jest.fn() as unknown as Wraplet;
    const callback = jest.fn(() => ({}));
    const wiring = lazyWiring(callback);

    expect(callback).not.toHaveBeenCalled();
    await wiring.destroyCallback?.(wraplet);
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it("delegates to the initialize callback of the returned wiring", async () => {
    const wraplet = jest.fn() as unknown as Wraplet;
    const innerInit = jest.fn();
    const wiring = lazyWiring(() => ({
      initializeCallback: innerInit,
    }));

    await wiring.initializeCallback?.(wraplet);
    expect(innerInit).toHaveBeenCalledTimes(1);
  });

  it("delegates to the destroy callback of the returned wiring", async () => {
    const wraplet = jest.fn() as unknown as Wraplet;
    const innerDestroy = jest.fn();
    const wiring = lazyWiring(() => ({
      destroyCallback: innerDestroy,
    }));

    await wiring.destroyCallback?.(wraplet);
    expect(innerDestroy).toHaveBeenCalledTimes(1);
  });

  it("evaluates the callback only once and reuses the returned wiring", async () => {
    const wraplet = jest.fn() as unknown as Wraplet;
    const callback = jest.fn(() => ({}));
    const wiring = lazyWiring(callback);

    await wiring.initializeCallback?.(wraplet);
    await wiring.initializeCallback?.(wraplet);
    await wiring.destroyCallback?.(wraplet);

    expect(callback).toHaveBeenCalledTimes(1);
  });

  it("handles a callback returning void without throwing", async () => {
    const wraplet = jest.fn() as unknown as Wraplet;
    const wiring = lazyWiring(() => {});

    await expect(wiring.initializeCallback?.(wraplet)).resolves.toBeUndefined();
    await expect(wiring.destroyCallback?.(wraplet)).resolves.toBeUndefined();
  });

  it("handles a returned wiring without the relevant callback", async () => {
    const wraplet = jest.fn() as unknown as Wraplet;
    const initOnly = lazyWiring(() => ({
      initializeCallback: jest.fn(),
    }));
    await expect(initOnly.destroyCallback?.(wraplet)).resolves.toBeUndefined();

    const destroyOnly = lazyWiring(() => ({
      destroyCallback: jest.fn(),
    }));
    await expect(
      destroyOnly.initializeCallback?.(wraplet),
    ).resolves.toBeUndefined();
  });

  it("propagates the resolved value of the returned initialize callback", async () => {
    const wraplet = jest.fn() as unknown as Wraplet;
    const wiring = lazyWiring(() => ({
      initializeCallback: async () => {
        // returns undefined, simulating a real async wiring
      },
    }));

    await expect(wiring.initializeCallback?.(wraplet)).resolves.toBeUndefined();
  });

  it("evaluates the callback only once even when it returns void", async () => {
    const wraplet = jest.fn() as unknown as Wraplet;
    const callback = jest.fn(() => {});
    const wiring = lazyWiring(callback);

    await wiring.initializeCallback?.(wraplet);
    await wiring.destroyCallback?.(wraplet);

    expect(callback).toHaveBeenCalledTimes(1);
  });
});

describe("composeWrapletApi", () => {
  it("returns a WrapletApi for the given node, wraplet and wirings", async () => {
    const node = document.createElement("div");
    const wraplet = {} as Wraplet;
    const initCb = jest.fn();
    const destroyCb = jest.fn();

    const api = composeWrapletApi(node, wraplet, [
      { initializeCallback: initCb, destroyCallback: destroyCb },
    ]);

    await api.initialize();
    expect(initCb).toHaveBeenCalledTimes(1);

    await api.destroy();
    expect(destroyCb).toHaveBeenCalledTimes(1);
  });
});

describe("wire", () => {
  it("registers initializeCallback on the api when provided", async () => {
    const node = document.createElement("div");
    const wraplet = {} as Wraplet;
    const api = createWrapletApi({ node, wraplet });
    const initCb = jest.fn();

    wire(api, { initializeCallback: initCb });
    await api.initialize();

    expect(initCb).toHaveBeenCalledTimes(1);
  });

  it("registers destroyCallback on the api when provided", async () => {
    const node = document.createElement("div");
    const wraplet = {} as Wraplet;
    const api = createWrapletApi({ node, wraplet });
    const destroyCb = jest.fn();

    wire(api, { destroyCallback: destroyCb });
    await api.initialize();
    await api.destroy();

    expect(destroyCb).toHaveBeenCalledTimes(1);
  });

  it("does not throw when wiring has no callbacks", async () => {
    const node = document.createElement("div");
    const wraplet = {} as Wraplet;
    const api = createWrapletApi({ node, wraplet });

    expect(() => wire(api, {})).not.toThrow();
  });
});
