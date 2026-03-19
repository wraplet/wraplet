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
});
