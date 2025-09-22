import "./setup";
import { MapWrapper } from "../src/Map/MapWrapper";
import { BaseElementTestWraplet } from "./resources/BaseElementTestWraplet";
import { MapRepeat, WrapletChildrenMap } from "../src";
import { fillMapWithDefaults } from "../src/WrapletChildrenMap";

it("Test MapWrapper traverse", () => {
  const mapChildMap = {
    deeperChild: {
      selector: "[data-item-child]",
      Class: class TestWrapletChild extends BaseElementTestWraplet {},
      multiple: false,
      required: false,
      map: MapRepeat.create(1),
    },
  } as const satisfies WrapletChildrenMap;

  const map = {
    child: {
      selector: "[data-item]",
      Class: class TestWrapletChild extends BaseElementTestWraplet {},
      multiple: false,
      required: false,
      map: mapChildMap,
    },
  } as const satisfies WrapletChildrenMap;

  const mapWrapper = new MapWrapper(map, ["child"]);

  // Original is the "child" map.
  expect(mapWrapper.getStartingMap()).toStrictEqual(
    fillMapWithDefaults(map["child"]["map"]),
  );

  mapWrapper.up("deeperChild");
  expect(mapWrapper.getCurrentMap()).toStrictEqual(
    fillMapWithDefaults(map["child"]["map"]),
  );

  // Make sure that looping with MapRepeat works.
  mapWrapper.up("deeperChild");
  expect(mapWrapper.getCurrentMap()).toStrictEqual(
    fillMapWithDefaults(map["child"]["map"]),
  );

  mapWrapper.down();
  expect(mapWrapper.getCurrentMap()).toStrictEqual(fillMapWithDefaults(map));

  const funcNonExistingMap = () => {
    mapWrapper.up("wrong-child");
  };

  expect(funcNonExistingMap).toThrow("Map doesn't exist.");

  const funcTooMuchDown = () => {
    mapWrapper.down();
  };

  expect(funcTooMuchDown).toThrow("At the root already.");
});

it("Test MapWrapper current map not found", () => {
  const map = {
    child: {
      Class: class TestWraplet extends BaseElementTestWraplet {},
      multiple: false,
      required: false,
    },
  } as const satisfies WrapletChildrenMap;

  const wrapper = new MapWrapper(map);

  const funcValid = () => {
    wrapper.resolve(["child"]);
  };

  expect(funcValid).not.toThrow();

  const funcInvalid = () => {
    wrapper.resolve(["child-nonexisting"]);
  };

  expect(funcInvalid).toThrow("Invalid path");
});

it("Test MapWrapper invalid map type", () => {
  const map = {
    child: {
      Class: class TestWraplet extends BaseElementTestWraplet {},
      multiple: false,
      required: false,
      map: class InvalidMapObject {} as any,
    },
  } as const satisfies WrapletChildrenMap;

  const wrapper = new MapWrapper(map);

  const funcInvalid = () => {
    wrapper.resolve(["child"]);
  };

  expect(funcInvalid).toThrow("Invalid map type.");

  const funcInvalid2 = () => {
    wrapper.up("child");
  };

  expect(funcInvalid2).toThrow("Invalid map type.");
});

it("Test MapWrapper delayed resolve", () => {
  const map = {
    child: {
      Class: class TestWraplet extends BaseElementTestWraplet {},
      multiple: false,
      required: false,
    },
  } as const satisfies WrapletChildrenMap;

  const wrapper = new MapWrapper(map);

  const func = () => {
    wrapper.up("child", false);
    wrapper.getCurrentMap();
    wrapper.down(false);
    wrapper.getCurrentMap();
  };

  expect(func).not.toThrow();
});
