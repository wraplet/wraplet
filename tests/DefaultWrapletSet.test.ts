import "./setup";
import { DefaultWrapletSetReadonly, Wraplet, WrapletSetReadonly } from "../src";
import { BaseElementTestWraplet } from "./resources/BaseElementTestWraplet";

describe("Test default wraplet set", () => {
  const attribute = "data-wraplet";
  class TestWraplet extends BaseElementTestWraplet {
    public getValue(): string | null {
      return this.node.getAttribute("data-value");
    }
    protected defineChildrenMap(): {} {
      return {};
    }
  }

  it("Test default wraplet set readonly item storage", () => {
    document.body.innerHTML = `
  <div ${attribute}></div>
  <div ${attribute}></div>
  `;

    const wraplets = TestWraplet.createAll<TestWraplet>(attribute);

    const set: WrapletSetReadonly = new DefaultWrapletSetReadonly(
      new Set<Wraplet>(wraplets),
    );

    expect(set.has(wraplets[0])).toBe(true);
    expect(set.size).toBe(2);
  });

  it("Test default wraplet set readonly searchable", () => {
    document.body.innerHTML = `
  <div ${attribute} data-value="1"></div>
  <div ${attribute} data-value="2"></div>
  `;

    const wraplets = TestWraplet.createAll<TestWraplet>(attribute);

    const set: WrapletSetReadonly = new DefaultWrapletSetReadonly(
      new Set<TestWraplet>(wraplets),
    );

    set.find((item: TestWraplet) => {

    });

    expect(set.has(wraplets[0])).toBe(true);
  });
});
