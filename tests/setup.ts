import { destroyWrapletsRecursively } from "../src";

afterEach(async () => {
  await destroyWrapletsRecursively(document);
  document.getElementsByTagName("html")[0].innerHTML = "";
});
