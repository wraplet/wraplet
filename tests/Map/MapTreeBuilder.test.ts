import { MapTreeBuilder } from "../../src/Map/MapTreeBuilder";

describe("MapTreeBuilder", () => {
  it("throws when getParent is called on a root builder", () => {
    const builder = new MapTreeBuilder();
    expect(() => builder.getParent()).toThrow("Parent not found.");
  });

  it("throws when getMap is called before setMap", () => {
    const builder = new MapTreeBuilder();
    expect(() => builder.getMap()).toThrow("Map is not set.");
  });
});
