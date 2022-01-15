import * as d3 from "d3";
import { directionColor, directionWidth } from "./helpers";

// const popcorn = document.querySelector("#popcorn");
// const tooltip = document.

export function createSvg() {
  const svg = d3
    .create("svg")
    .attr("width", "100%")
    .attr("height", "100%")
    .attr("viewBox", ["-500", "-500", "1000", "1000"]);

  const defs = svg.append("defs");
  const arrowWidthBase = 15;
  const arrowHeightBase = 20;
  [
    {
      id: "arrowhead-both",
      color: directionColor.both,
      baseWidth: directionWidth.both,
    },
    {
      id: "arrowhead-either",
      color: directionColor.either,
      baseWidth: directionWidth.either,
    },
  ].forEach(({ id, color, baseWidth }) => {
    const arrowWidth = arrowWidthBase / baseWidth,
      arrowHeight = arrowHeightBase / baseWidth;
    defs
      .append("marker")
      .attr("id", id)
      .attr("fill", color)
      .attr("refX", arrowWidth)
      .attr("refY", arrowHeight / 2)
      .attr("markerWidth", arrowWidth)
      .attr("markerHeight", arrowHeight)
      .attr("orient", "auto-start-reverse")
      .append("polygon")
      .attr(
        "points",
        `0 0, ${arrowWidth} ${arrowHeight / 2}, 0 ${arrowHeight}`
      );
  });

  return svg;
}

export type DepsGraphOptions = {
  width: number;
  height: number;
};
