import "./setup";
import { DefaultCore, WrapletChildrenMap } from "../src";
import { ChildWrongInstanceError, MapError } from "../src/errors";
import { Core } from "../src/types/Core";

describe("Test Core", () => {
  const wrapletMockCreator = () => {
    return {
      addEventListener: jest.fn(),
      addDestroyListener: jest.fn(),
      accessNode: jest.fn(),
    };
  };

  it("Test Core not allowing children if provided node is not a ParentNode", () => {
    const map = {
      children: {
        selector: "[data-something]",
        Class: jest.fn() as any,
        multiple: false,
        required: false,
      },
    } as const satisfies WrapletChildrenMap;

    const node = document.createTextNode("test");

    const func1 = () => {
      const core = new DefaultCore(map);
      core.instantiateChildren(node);
    };

    expect(func1).toThrow(MapError);

    const func2 = () => {
      const core = new DefaultCore({});
      core.instantiateChildren(node);
    };

    expect(func2).not.toThrow(MapError);
  });

  it("Test Core wrong child instance", () => {
    const node = document.createElement("div");
    node.innerHTML = `
  <div data-something></div>
  <div data-something></div>
`;

    const wrapletMock = wrapletMockCreator();
    wrapletMock.accessNode.mockImplementation((callback) => {
      callback(node);
    });

    const map = {
      children: {
        selector: "[data-something]",
        Class: wrapletMock.constructor as any,
        multiple: true,
        required: false,
      },
    } as const satisfies WrapletChildrenMap;

    const core: Core<typeof map> = new DefaultCore(map);

    const func = () => {
      core.init(wrapletMock as any);
    };

    expect(func).toThrow(ChildWrongInstanceError);
  });
});
