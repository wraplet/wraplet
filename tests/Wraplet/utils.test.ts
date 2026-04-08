import { isOverridden } from "../../src/Wraplet/utils";

describe("isOverridden", () => {
  it("uses immediate parent as stop prototype when stopAt is not provided", () => {
    class Base {
      method() {}
    }
    class Child extends Base {
      override method() {}
    }

    const instance = new Child();
    // Without stopAt, stopProto = Object.getPrototypeOf(proto) = Base.prototype,
    // so it only checks Child.prototype — where method IS defined.
    expect(isOverridden(instance, "method")).toBe(true);

    // A method not overridden on the immediate prototype
    expect(isOverridden(instance, "toString")).toBe(false);
  });
});
