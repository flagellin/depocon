import { Selection } from "d3";
import { Fiber, FieldParticle } from "../modelToViewModel";
import { directionColor, directionWidth } from "./helpers";

function applyStyle(selection: Selection<any, Fiber, any, any>) {
  const path = selection
    .attr("stroke-width", (f) => directionWidth[f.direction])
    .attr("stroke", (f) => directionColor[f.direction]);

  path
    .attr("class", "fiber")
    .filter((f) => f.direction === "either")
    .attr("marker-end", `url(#arrowhead-either)`);

  path
    .filter((f) => f.direction === "both")
    .attr("class", "fiber both-direction")
    .attr("marker-end", "url(#arrowhead-both)")
    .attr("marker-start", "url(#arrowhead-both)");

  path
    .attr("data-message", (f) => {
      const maxLength = Math.max(...f.origins.map((o) => o.sourceId.length));
      const space = new Array(maxLength).fill(" ").join("");
      return `
# ${
        f.direction === "both"
          ? `${f.source.id} and ${f.target.id} depend each other!`
          : `${f.source.id} depends on ${f.target.id}`
      }
----------------------------------------------
${f.origins
  .map((o) => `${o.sourceId + space.slice(o.sourceId.length)} -> ${o.targetId}`)
  .join("\n")}
`.trim();
    })
    .style("cursor", "pointer");
}

export function renderFibers(
  entry: Selection<any, any, any, any>,
  field: FieldParticle
) {
  entry
    .selectChildren("path")
    .data(field.fibers, (f: Fiber) => f.id)
    .join(
      (enter) => enter.append("path").call(applyStyle),
      (update) => update.call(applyStyle),
      (exit) => exit.remove()
    );
}
