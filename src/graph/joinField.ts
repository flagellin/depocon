import * as d3 from "d3";
import { Selection } from "d3";
import { FieldParticle, Particle } from "../modelToViewModel";
import { particleId, particleRadius } from "./helpers";
import { fieldTextOffsetThresholdRadius } from "./particleVariables";
import { renderFibers } from "./renderFibers";

function setCircleStyle(
  selection: Selection<SVGCircleElement, Particle, any, any>
) {
  selection
    .attr("fill", (p) => {
      if (p.isField) {
        if (p.isExpanded) return "none";
        if (p.includeBothDirection) return "#ecd4d4";
        return "#d7eae2";
      }
      return "currentColor";
    })
    .attr("stroke", "currentColor")
    .attr("stroke-opacity", 1)
    .attr("stroke-width", 3)
    .attr("r", particleRadius);
}

function setCircleText(
  selection: Selection<SVGTextElement, Particle, any, any>
) {
  selection
    .text((p) => p.name)
    .attr("text-anchor", "middle")
    .attr("font-size", (p) => {
      const radius = particleRadius(p);
      return Math.max((15 * radius) / fieldTextOffsetThresholdRadius, 15);
    })
    .each(function (p) {
      const radius = particleRadius(p);
      const fontSize = Math.max(
        (15 * radius) / fieldTextOffsetThresholdRadius,
        15
      );
      const offsetY =
        -radius +
        (fieldTextOffsetThresholdRadius >= radius ? -(fontSize / 2) : fontSize);

      d3.select(this)
        .attr("transform", `translate(0, ${offsetY})`)
        .attr("font-size", fontSize);
    })
    .filter((v) => v.isField)
    .attr("class", "field-title")
    .attr("data-field-id", (v) => v.id)
    .style("cursor", "pointer");
}

export function joinField(
  entrySelection: Selection<SVGGElement | SVGSVGElement, void, any, any>,
  particles: Particle[],
  isRoot?: boolean
) {
  const particle = entrySelection
    .selectChildren<SVGGElement, undefined>("g")
    .data(particles, (f: Particle) => f.id)
    .join(
      (enter) => {
        const g = enter
          .append("g")
          .attr("id", particleId)
          .attr("class", "particle")
          .attr("data-particle-id", (f) => f.id)
          .style("cursor", "grab")
          .each(function (p) {
            if (p.isField) {
              renderFibers(d3.select(this), p);
            }
          });
        if (!isRoot) {
          g.append("circle").call(setCircleStyle);
          g.append("text").call(setCircleText);
        }
        return g;
      },
      (update) => {
        const g = update;
        if (!isRoot) {
          g.selectChild("circle").call(setCircleStyle);
          g.selectChild("text").call(setCircleText);
        }
        return g.each(function (p) {
          if (p.isField) {
            renderFibers(d3.select(this), p);
          }
        });
      },
      (exit) => {
        exit.remove();
      }
    );

  particle
    .filter((p) => p.isField)
    .each(function (field: FieldParticle) {
      d3.select(this).call(joinField, field.particles);
    });
  return particle;
}
