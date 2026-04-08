import { createNodelessWrapletApi } from "../../src/Wraplet/createNodelessWrapletApi";
import { NodelessWrapletSymbol } from "../../src/Wraplet/types/Wraplet";

describe("createNodelessWrapletApi", () => {
  it("destroys without error when no destroyCallback is provided", async () => {
    const mockWraplet = { [NodelessWrapletSymbol]: true } as any;

    const api = createNodelessWrapletApi({
      wraplet: mockWraplet,
    });

    await api.initialize();
    await expect(api.destroy).resolves.not.toThrow();
    expect(api.status.isDestroyed).toBe(true);
  });
});
