import "../setup";
import { BaseElementTestWraplet } from "../resources/BaseElementTestWraplet";
import { MapRepeat, WrapletChildrenMap } from "../../src";
import { MapWrapper } from "../../src/Map/MapWrapper";
import { fillMapWithDefaults } from "../../src/Map/utils";

it("MapRepeat repeats", () => {
  const map = {
    child: {
      selector: "[data-item]",
      Class: class TestWrapletChild extends BaseElementTestWraplet {},
      multiple: false,
      required: false,
      map: {
        deeperChild0: {
          selector: "[data-item-child]",
          Class: class TestWrapletChild extends BaseElementTestWraplet {},
          multiple: false,
          required: false,
          map: MapRepeat.create(1),
        },
        deeperChild1: {
          selector: "[data-item-child]",
          Class: class TestWrapletChild extends BaseElementTestWraplet {},
          multiple: false,
          required: false,
          map: MapRepeat.create(2),
        },
      },
    },
  } as const satisfies WrapletChildrenMap;

  let mapWrapper = new MapWrapper(map);
  mapWrapper.up("child");
  mapWrapper.up("deeperChild0");
  expect(mapWrapper.getCurrentMap()).toStrictEqual(
    fillMapWithDefaults(map)["child"]["map"],
  );

  mapWrapper = new MapWrapper(map);
  mapWrapper.up("child");
  mapWrapper.up("deeperChild1");
  expect(mapWrapper.getCurrentMap()).toStrictEqual(fillMapWithDefaults(map));
});

it("MapRepeat wrong levels", () => {
  const func0 = () => {
    new MapRepeat(0);
  };
  expect(func0).toThrow("There have to be more than 0 repeated levels.");

  const funcDefault = () => {
    new MapRepeat();
    MapRepeat.create();
  };
  expect(funcDefault).not.toThrow();
});
