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
  it("throws when calling createWraplets directly on AbstractWraplet", () => {
    expect(() =>
      (AbstractWraplet as any).createWraplets(
        document.createElement("div"),
        "data-test",
      ),
    ).toThrow("You cannot instantiate an abstract class.");
  });

  it("createWraplets matches top element and querySelectorAll children", () => {
    class SimpleWraplet extends AbstractWraplet<HTMLElement> {
      public static create(
        node: ParentNode,
        attribute: string,
      ): SimpleWraplet[] {
        return this.createWraplets(node, attribute);
      }
    }

    const container = document.createElement("div");
    container.setAttribute("data-w", "");
    const child1 = document.createElement("span");
    child1.setAttribute("data-w", "");
    const child2 = document.createElement("p");
    child2.setAttribute("data-w", "");
    container.appendChild(child1);
    container.appendChild(child2);

    const wraplets = SimpleWraplet.create(container, "data-w");
    // top element + 2 children
    expect(wraplets).toHaveLength(3);
    wraplets.forEach((w) => expect(w).toBeInstanceOf(SimpleWraplet));
  });

  it("createWraplets skips top element when it lacks the attribute", () => {
    class SimpleWraplet extends AbstractWraplet<HTMLElement> {
      public static create(
        node: ParentNode,
        attribute: string,
      ): SimpleWraplet[] {
        return this.createWraplets(node, attribute);
      }
    }

    const container = document.createElement("div");
    const child = document.createElement("span");
    child.setAttribute("data-w", "");
    container.appendChild(child);

    const wraplets = SimpleWraplet.create(container, "data-w");
    // only the child, top element has no attribute
    expect(wraplets).toHaveLength(1);
  });
});
