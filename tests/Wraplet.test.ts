import { isWraplet, Wraplet } from "../src";
import { WrapletSymbol } from "../src/types/Wraplet";

it("Test isWraplet", () => {
  class NoWrapletClass {}

  const noWraplet = new NoWrapletClass();

  expect(isWraplet(noWraplet)).toBe(false);

  class WrapletClass implements Wraplet {
    [WrapletSymbol]: true = true;
    public isGettingInitialized: boolean = false;
    public isInitialized: boolean = true;
    public isGettingDestroyed: boolean = false;
    public isDestroyed: boolean = false;

    public accessNode(): void {}

    public addDestroyListener(): void {}

    public destroy(): void {}
  }

  const wraplet = new WrapletClass();

  expect(isWraplet(wraplet)).toBe(true);
});
