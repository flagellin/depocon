import { deps1, deps2, deps3 } from "./data";
import { Depocon } from "../src/depocon";

const chart1 = Depocon(deps1),
  chart2 = Depocon(deps2),
  chart3 = Depocon(deps3);

window.addEventListener("DOMContentLoaded", () => {
  const body = document.querySelector("#app");
  [chart1, chart2, chart3].forEach((chart) => {
    const container = document.createElement("div");
    container.style.height = "500px";
    container.style.border = "solid 2px grey";
    container.style.marginBottom = "30px";
    container.style.position = "relative";
    container.append(chart);
    body.append(container);
  });
});
