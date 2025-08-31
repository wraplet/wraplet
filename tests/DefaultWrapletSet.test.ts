import "./setup";
import { DefaultWrapletSetReadonly, Wraplet, WrapletSetReadonly } from "../src";
import { BaseElementTestWraplet } from "./resources/BaseElementTestWraplet";

describe("Test default wraplet set", () => {
  const attribute = "data-wraplet";
  class TestWraplet extends BaseElementTestWraplet {
    public getValue(): number | null {
      return Number(this.node.getAttribute("data-value")) || null;
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

    const set: WrapletSetReadonly<TestWraplet> = new DefaultWrapletSetReadonly(
      new Set<TestWraplet>(wraplets),
    );

    const result = set.find((item: TestWraplet) => {
      return item.getValue() === 1;
    });

    expect(result.length).toBe(1);

    const resultEmpty = set.find((item: TestWraplet) => {
      return item.getValue() === 3;
    });

    expect(resultEmpty.length).toBe(0);

    const resultOne = set.findOne((item: TestWraplet) => {
      return item.getValue() === 1;
    });

    expect(resultOne).toBeInstanceOf(TestWraplet);

    const resultOneNull = set.findOne((item: TestWraplet) => {
      return item.getValue() === 3;
    });

    expect(resultOneNull).toBeNull();
  });

  it("Test default wraplet set readonly getOrdered", () => {
    document.body.innerHTML = `
  <div ${attribute} data-value="2"></div>
  <div ${attribute} data-value="3"></div>  
  <div ${attribute} data-value="1"></div>
  `;

    const wraplets = TestWraplet.createAll<TestWraplet>(attribute);

    const set: WrapletSetReadonly<TestWraplet> = new DefaultWrapletSetReadonly(
      new Set<TestWraplet>(wraplets),
    );

    const result = set.getOrdered((item) => item.getValue() ?? 0);

    expect(result[0].getValue()).toBe(1);
    expect(result[1].getValue()).toBe(2);
    expect(result[2].getValue()).toBe(3);
  });
});
