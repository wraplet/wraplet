import { isWraplet, Wraplet } from "../src";
import { WrapletSymbol } from "../src/types/Wraplet";

it("Test isWraplet", () => {
  class NoWrapletClass {}

  const noWraplet = new NoWrapletClass();

  expect(isWraplet(noWraplet)).toBe(false);

  class WrapletClass implements Wraplet {
    [WrapletSymbol]: true = true;
    isInitialized: boolean = true;

    accessNode(): void {}

    addDestroyListener(): void {}

    destroy(): void {}

    isDestroyed(): boolean {
      return false;
    }
  }

  const wraplet = new WrapletClass();

  expect(isWraplet(wraplet)).toBe(true);
});
