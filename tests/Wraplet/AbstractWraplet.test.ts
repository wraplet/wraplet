import { AbstractWraplet } from "../../src/Wraplet/AbstractWraplet";

class ConcreteWraplet extends AbstractWraplet<HTMLElement> {
  public getNodeManager() {
    return this.nodeManager;
  }
}

describe("AbstractWraplet", () => {
  it("throws when constructed with a non-Node argument", () => {
    expect(() => new ConcreteWraplet("not-a-node" as any)).toThrow(
      "AbstractWraplet requires a Node instance.",
    );
  });

  it("lazily creates a NodeManager on first access", () => {
    const wraplet = new ConcreteWraplet(document.createElement("div"));
    expect((wraplet as any)._nodeManager).toBeUndefined();
    const manager = wraplet.getNodeManager();
    expect(manager).toBeDefined();
    // Second access returns the same instance
    expect(wraplet.getNodeManager()).toBe(manager);
  });

  it("handles method overrides when only parent overrides", async () => {
    const funcInit = jest.fn();
    const funcDestroy = jest.fn();
    class LevelOne extends AbstractWraplet {
      protected async onInitialize() {
        funcInit();
      }

      protected async onDestroy() {
        funcDestroy();
      }
    }
    class LevelTwo extends LevelOne {}

    const wraplet = new LevelTwo(document.createElement("div"));
    await wraplet.wraplet.initialize();
    await wraplet.wraplet.destroy();

    expect(funcInit).toHaveBeenCalledTimes(1);
    expect(funcDestroy).toHaveBeenCalledTimes(1);
  });
});
