import "../setup";

import { NodeManager } from "../../src/Wraplet/NodeManager";

it("addListener attaches a listener to the node and destroy removes it", () => {
  document.body.innerHTML = `<div id="root"></div>`;
  const root = document.getElementById("root") as HTMLDivElement;
  const manager = new NodeManager(root);
  const callback = jest.fn();

  manager.addListener("click", callback);
  root.dispatchEvent(new Event("click"));
  expect(callback).toHaveBeenCalledTimes(1);

  manager.destroy();
  root.dispatchEvent(new Event("click"));
  expect(callback).toHaveBeenCalledTimes(1);
});

it("addListener supports options argument", () => {
  document.body.innerHTML = `<div id="root"></div>`;
  const root = document.getElementById("root") as HTMLDivElement;
  const manager = new NodeManager(root);
  const callback = jest.fn();

  manager.addListener("click", callback, { once: true });
  root.dispatchEvent(new Event("click"));
  root.dispatchEvent(new Event("click"));
  expect(callback).toHaveBeenCalledTimes(1);

  manager.destroy();
});

it("addListenerTo attaches listeners to children matching a string selector", () => {
  document.body.innerHTML = `
<div id="root">
  <button class="btn"></button>
  <button class="btn"></button>
</div>`;
  const root = document.getElementById("root") as HTMLDivElement;
  const manager = new NodeManager(root);
  const callback = jest.fn();

  manager.addListenerTo(".btn", "click", callback);
  const buttons = root.querySelectorAll(".btn");
  buttons.forEach((b) => b.dispatchEvent(new Event("click")));
  expect(callback).toHaveBeenCalledTimes(2);

  manager.destroy();
  buttons.forEach((b) => b.dispatchEvent(new Event("click")));
  expect(callback).toHaveBeenCalledTimes(2);
});

it("addListenerTo attaches a listener to a Node found by a callback", () => {
  document.body.innerHTML = `
<div id="root">
  <button class="btn"></button>
</div>`;
  const root = document.getElementById("root") as HTMLDivElement;
  const button = root.querySelector(".btn") as HTMLButtonElement;
  const manager = new NodeManager(root);
  const callback = jest.fn();

  manager.addListenerTo(
    (node) => {
      return Array.from(node.querySelectorAll(".btn"));
    },
    "click",
    callback,
    false,
  );
  button.dispatchEvent(new Event("click"));
  expect(callback).toHaveBeenCalledTimes(1);

  manager.destroy();
  button.dispatchEvent(new Event("click"));
  expect(callback).toHaveBeenCalledTimes(1);
});

it("addListenerTo throws when required is true and no nodes are found", () => {
  document.body.innerHTML = `<div id="root"></div>`;
  const root = document.getElementById("root") as HTMLDivElement;
  const manager = new NodeManager(root);

  expect(() =>
    manager.addListenerTo(".missing", "click", () => {}, undefined, true),
  ).toThrow("No nodes found");

  manager.destroy();
});

it("addListenerTo throws when the manager's node is not a parent node", () => {
  const textNode = document.createTextNode("text");
  const manager = new NodeManager(textNode);
  const callback = jest.fn();

  expect(() => manager.addListenerTo("anything", "click", callback)).toThrow(
    "Target node is not a parent node. Cannot add listener to its child.",
  );
});
