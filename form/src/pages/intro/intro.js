import { loadHtml } from "../../utils/loadHtml.js";

export const introPage = {
  id: "intro",
  async render(host) {
    host.innerHTML = await loadHtml("./src/pages/intro/intro.html");
  },
  validate() {
    return true;
  }
};