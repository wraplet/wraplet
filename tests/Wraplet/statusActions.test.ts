import { destructionStarted } from "../../src/Wraplet/statusActions";
import { StatusWritable } from "../../src/Wraplet/types/Status";

describe("statusActions", () => {
  it("throws when destroying a wraplet that was never initialized", () => {
    const status: StatusWritable = {
      isInitialized: false,
      isGettingInitialized: false,
      isDestroyed: false,
      isGettingDestroyed: false,
    };

    expect(() => destructionStarted(status)).toThrow(
      "Wraplet cannot be destroyed before it is initialized.",
    );
  });
});
