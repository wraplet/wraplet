import { destroyWrapletsRecursively } from "../src";

afterEach(() => {
  destroyWrapletsRecursively(document);
  document.getElementsByTagName("html")[0].innerHTML = "";
});
