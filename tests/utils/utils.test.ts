import {
  actOnDependencies,
  actOnDependenciesWraplets,
  throwIfErrors,
} from "../../src/utils/utils";
import { DefaultWrapletSet, Wraplet, WrapletDependencyMap } from "../../src";
import { WrapletDependencies } from "../../src/Wraplet/types/WrapletDependencies";

describe("general utils/helpers", () => {
  it("throwIfErrors does nothing for empty errors array", () => {
    expect(() => throwIfErrors([], "ignored")).not.toThrow();
  });

  it("throwIfErrors throws AggregateError with provided message", () => {
    const error = new Error("failure");

    expect(() => throwIfErrors([error], "Custom message")).toThrow(
      "Custom message",
    );
    expect(() => throwIfErrors([error], "Custom message")).toThrow(
      AggregateError,
    );
  });

  it("actOnDependencies invokes the callback for every dependency entry", async () => {
    const firstWraplet = jest.fn() as unknown as Wraplet;
    const wrapletSet = new DefaultWrapletSet();

    const dependencies = {
      first: firstWraplet,
      set: wrapletSet,
      missing: undefined,
      nullable: null,
    } as unknown as WrapletDependencies<WrapletDependencyMap>;

    const callback = jest.fn().mockResolvedValue(undefined);

    await actOnDependencies(dependencies, callback);

    expect(callback).toHaveBeenCalledTimes(4);
    expect(callback).toHaveBeenCalledWith("first", firstWraplet);
    expect(callback).toHaveBeenCalledWith("set", wrapletSet);
    expect(callback).toHaveBeenCalledWith("missing", undefined);
    expect(callback).toHaveBeenCalledWith("nullable", null);
  });

  it("actOnDependencies runs callbacks in parallel for every dependency", async () => {
    const dependencies = {
      first: jest.fn() as unknown as Wraplet,
      second: jest.fn() as unknown as Wraplet,
      third: jest.fn() as unknown as Wraplet,
    } as unknown as WrapletDependencies<WrapletDependencyMap>;

    const total = Object.keys(dependencies).length;
    let started = 0;
    let releaseAll!: () => void;
    const allStarted = new Promise<void>((resolve) => {
      releaseAll = resolve;
    });

    const callback = jest.fn().mockImplementation(async () => {
      started++;
      if (started === total) {
        releaseAll();
      }
      // If callbacks ran sequentially, this would never resolve because
      // the next callback could not start to reach the release condition.
      await allStarted;
    });

    await actOnDependencies(dependencies, callback);

    expect(started).toBe(total);
    expect(callback).toHaveBeenCalledTimes(total);
  });

  it("actOnDependencies works with an empty dependencies object", async () => {
    const callback = jest.fn().mockResolvedValue(undefined);

    await actOnDependencies(
      {} as unknown as WrapletDependencies<WrapletDependencyMap>,
      callback,
    );

    expect(callback).not.toHaveBeenCalled();
  });

  it("actOnDependencies propagates errors thrown in the callback", async () => {
    const dependencies = {
      first: jest.fn() as unknown as Wraplet,
    } as unknown as WrapletDependencies<WrapletDependencyMap>;

    const callback = jest.fn().mockRejectedValue(new Error("callback failure"));

    await expect(actOnDependencies(dependencies, callback)).rejects.toThrow(
      "callback failure",
    );
  });

  it("actOnDependenciesWraplets invokes the callback for single wraplets and every wraplet in a set", async () => {
    const firstWraplet = jest.fn() as unknown as Wraplet;
    const secondWraplet = jest.fn() as unknown as Wraplet;
    const thirdWraplet = jest.fn() as unknown as Wraplet;

    const wrapletSet = new DefaultWrapletSet();
    wrapletSet.add(secondWraplet);
    wrapletSet.add(thirdWraplet);

    const dependencies = {
      first: firstWraplet,
      set: wrapletSet,
      missing: undefined,
      nullable: null,
    } as unknown as WrapletDependencies<WrapletDependencyMap>;

    const callback = jest.fn().mockResolvedValue(undefined);

    await actOnDependenciesWraplets(dependencies, callback);

    expect(callback).toHaveBeenCalledTimes(3);
    expect(callback).toHaveBeenCalledWith("first", firstWraplet);
    expect(callback).toHaveBeenCalledWith("set", secondWraplet);
    expect(callback).toHaveBeenCalledWith("set", thirdWraplet);
  });

  it("actOnDependenciesWraplets runs callbacks in parallel for every wraplet", async () => {
    const firstWraplet = jest.fn() as unknown as Wraplet;
    const secondWraplet = jest.fn() as unknown as Wraplet;
    const thirdWraplet = jest.fn() as unknown as Wraplet;

    const wrapletSet = new DefaultWrapletSet();
    wrapletSet.add(secondWraplet);
    wrapletSet.add(thirdWraplet);

    const dependencies = {
      first: firstWraplet,
      set: wrapletSet,
    } as unknown as WrapletDependencies<WrapletDependencyMap>;

    const total = 3;
    let started = 0;
    let releaseAll!: () => void;
    const allStarted = new Promise<void>((resolve) => {
      releaseAll = resolve;
    });

    const callback = jest.fn().mockImplementation(async () => {
      started++;
      if (started === total) {
        releaseAll();
      }
      // If wraplets were processed sequentially, this would never resolve
      // because the remaining callbacks could not start.
      await allStarted;
    });

    await actOnDependenciesWraplets(dependencies, callback);

    expect(started).toBe(total);
    expect(callback).toHaveBeenCalledTimes(total);
  });

  it("actOnDependenciesWraplets skips empty dependency values", async () => {
    const dependencies = {
      missing: undefined,
      nullable: null,
    } as unknown as WrapletDependencies<WrapletDependencyMap>;

    const callback = jest.fn().mockResolvedValue(undefined);

    await actOnDependenciesWraplets(dependencies, callback);

    expect(callback).not.toHaveBeenCalled();
  });

  it("actOnDependenciesWraplets does not invoke the callback for an empty wraplet set", async () => {
    const wrapletSet = new DefaultWrapletSet();

    const dependencies = {
      set: wrapletSet,
    } as unknown as WrapletDependencies<WrapletDependencyMap>;

    const callback = jest.fn().mockResolvedValue(undefined);

    await actOnDependenciesWraplets(dependencies, callback);

    expect(callback).not.toHaveBeenCalled();
  });

  it("actOnDependenciesWraplets propagates errors thrown in the callback", async () => {
    const dependencies = {
      first: jest.fn() as unknown as Wraplet,
    } as unknown as WrapletDependencies<WrapletDependencyMap>;

    const callback = jest
      .fn()
      .mockRejectedValue(new Error("wraplet callback failure"));

    await expect(
      actOnDependenciesWraplets(dependencies, callback),
    ).rejects.toThrow("wraplet callback failure");
  });
});
