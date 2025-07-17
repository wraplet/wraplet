import "./setup";
import { AbstractWraplet, WrapletChildrenMap } from "../src";
import { BaseElementTestWraplet } from "./resources/BaseElementTestWraplet";
import { MapError } from "../src/errors";
import { CoreInitOptions } from "../src/types/CoreInitOptions";

const testWrapletSelectorAttribute = "data-test-selector";

class TestWrapletChild extends AbstractWraplet<any> {
  protected defineChildrenMap(): {} {
    return {};
  }
}

const childrenMap = {
  children: {
    Class: TestWrapletChild,
    multiple: false,
    required: true,
  },
} as const satisfies WrapletChildrenMap;

class TestWraplet extends BaseElementTestWraplet<typeof childrenMap> {
  protected defineChildrenMap(): typeof childrenMap {
    return childrenMap;
  }
}

class TestNodeWraplet extends AbstractWraplet<typeof childrenMap> {
  protected defineChildrenMap(): typeof childrenMap {
    return childrenMap;
  }
}

// TESTS START HERE

test("Test that 'required' and missing selector are mutually exclusive", () => {
  document.body.innerHTML = `<div ${testWrapletSelectorAttribute}></div>`;
  const createWraplet = () => {
    TestWraplet.create(testWrapletSelectorAttribute);
  };
  expect(createWraplet).toThrow(MapError);
});

test("Test that map has to be empty if wrapped node cannot have children", () => {
  const textNode = document.createTextNode("test");
  const createNodeWraplet = () => {
    new TestNodeWraplet(textNode);
  };
  expect(createNodeWraplet).toThrow(MapError);
});

test("Test map altering", () => {
  const mapAlterChildrenMap = {
    child: {
      selector: ".something",
      Class: TestWrapletChild,
      multiple: false,
      required: true,
    },
  } as const satisfies WrapletChildrenMap;

  class TestAlterMapWraplet extends AbstractWraplet<
    typeof mapAlterChildrenMap
  > {
    protected defineChildrenMap(): typeof mapAlterChildrenMap {
      return mapAlterChildrenMap;
    }

    public getAlteredMap() {
      return this.core.map;
    }
  }

  const mainAttribute = "data-main";
  const alteredClass = "altered";

  document.body.innerHTML = `
<div ${mainAttribute}>
    <div class="${alteredClass}"></div>
</div>`;

  const element = document.querySelector(`[${mainAttribute}]`) as Element;
  const alteredSelector = `.${alteredClass}`;
  const initOptions: Partial<CoreInitOptions<typeof mapAlterChildrenMap>> = {
    mapAlterCallback: (map) => {
      (map["child"]["selector"] as string) = alteredSelector;
    },
  };

  const wraplet = new TestAlterMapWraplet(element, initOptions);

  const alteredMap = wraplet.getAlteredMap();
  expect(alteredMap["child"]["selector"]).toBe(alteredSelector);
});
