import "./setup";
import {
  AbstractWraplet,
  DefaultCore,
  DefaultWrapletSet,
  destroyWrapletsRecursively,
  getWrapletsFromNode,
  Wraplet,
  WrapletApi,
  WrapletSet,
} from "../src";
import {
  addWrapletToNode,
  removeWrapletFromNode,
} from "../src/NodeTreeManager/utils";
import { NodeTreeParent } from "../src/NodeTreeManager/types/NodeTreeParent";
import { Groupable } from "../src/types/Groupable";

import { WrapletApiFactoryArgs } from "../src/Wraplet/types/WrapletApiFactoryArgs";

it("Test removing and adding wraplets to nodes", () => {
  const node = document.createElement("div");
  const mock = jest.fn() as unknown as Wraplet<HTMLDivElement>;

  const removed = removeWrapletFromNode(mock, node);
  // Wasn't added so it cannot be removed.
  expect(removed).toBe(false);

  addWrapletToNode(mock, node);
  expect(node.wraplets).toBeDefined();
  const wraplets = getWrapletsFromNode(node);
  expect(wraplets).toBeInstanceOf(DefaultWrapletSet);
  expect(wraplets.size).toBe(1);

  wraplets.has(mock);

  removeWrapletFromNode(mock, node);

  expect(wraplets.size).toBe(0);
});

it("addWrapletToNode", () => {
  const element = document.createElement("div");
  class TestWraplet extends AbstractWraplet {}

  const core = new DefaultCore(element, {});
  const wraplet = new TestWraplet(core);

  addWrapletToNode(wraplet, element);

  expect(element.wraplets).toBeInstanceOf(DefaultWrapletSet);

  // Make sure that wraplet has been added only once.
  addWrapletToNode(wraplet, element);
  expect((element.wraplets as WrapletSet).size).toBe(1);
  expect((element.wraplets as WrapletSet).has(wraplet)).toBe(true);
});

it("destroyWrapletsRecursively", async () => {
  const element = document.createElement("div");

  const counter = jest.fn();

  class TestWraplet extends AbstractWraplet {
    protected createWrapletApi(
      args: WrapletApiFactoryArgs,
    ): WrapletApi & NodeTreeParent["wraplet"] & Groupable["wraplet"] {
      args.destroyCallback = async () => {
        counter();
      };
      return super.createWrapletApi(args);
    }
  }

  const core = new DefaultCore(element, {});
  const wraplet = new TestWraplet(core);
  await wraplet.wraplet.initialize();

  addWrapletToNode(wraplet, element);

  expect((element.wraplets as WrapletSet).size).toBe(1);
  await destroyWrapletsRecursively(element);
  expect((element.wraplets as WrapletSet).size).toBe(0);
  expect(counter).toHaveBeenCalledTimes(1);

  // Re-add an already destroyed wraplet to the node.
  addWrapletToNode(wraplet, element);

  // Now destruction should not be invoked, so the counter shouldn't change.
  await destroyWrapletsRecursively(element);
  expect(counter).toHaveBeenCalledTimes(1);
});
