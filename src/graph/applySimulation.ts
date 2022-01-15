import { FieldParticle, Particle } from "../modelToViewModel";
import * as d3 from "d3";
import { Simulation } from "d3";
import { particleId, particleRadius, RootSelection } from "./helpers";
import { fieldMargin } from "./particleVariables";

const alpha = 0.1;

export function drag(simulation: Simulation<Particle, undefined>) {
  function dragstarted(event) {
    if (!event.active) simulation.alphaTarget(0.3).restart();
    event.subject.fx = event.subject.x;
    event.subject.fy = event.subject.y;
  }

  function dragged(event) {
    event.subject.fx = event.x;
    event.subject.fy = event.y;
  }

  function dragended(event) {
    if (!event.active) simulation.alphaTarget(0).alphaDecay(0.1);
    event.subject.fx = null;
    event.subject.fy = null;
  }

  return d3
    .drag<SVGGElement, any>()
    .on("start", dragstarted)
    .on("drag", dragged)
    .on("end", dragended);
}

function collisionRadius(p: Particle) {
  return particleRadius(p) + fieldMargin;
}

function createSimulation(field: FieldParticle) {
  console.log("createSimulation", field.id);
  const sim = d3
    .forceSimulation(field.particles)
    .alpha(0.5)
    .alphaDecay(0.1)
    .velocityDecay(0.6)
    .force(
      "link",
      d3
        .forceLink(field.fibers)
        .id((v: Particle) => {
          return v.id;
        })
        // .distance(100)
        .strength(0.1)
        .iterations(1)
    )
    .force("collide", d3.forceCollide().radius(collisionRadius));
  // .force("charge", d3.forceManyBody().distanceMax(1));
  // if (!field.isRoot) {
  return sim
    .force("x", d3.forceX().strength(0.3))
    .force("y", d3.forceY().strength(0.3));
  // .force("center", d3.forceCenter().strength(0.1))
  // }
  // return sim;
}

export function applySimulation(svg: RootSelection, field: FieldParticle) {
  const field$ = svg.select(`#${particleId(field)}`),
    particle$ = field$.selectChildren("g.particle").data(field.particles),
    fiber$ = field$.selectChildren("path.fiber").data(field.fibers);

  const sim = createSimulation(field);

  particle$.call(drag(sim));
  sim.on("tick", ticked);

  function ticked() {
    fiber$.attr("d", function (fiber) {
      const { source, sourceRadius, target, targetRadius } = fiber;
      const deltaX = source.x - target.x,
        deltaY = source.y - target.y,
        distance = Math.sqrt(deltaY * deltaY + deltaX * deltaX);
      if (distance === 0)
        return `M${source.x},${source.y} L${target.x},${target.y}`;
      const cos = deltaX / distance,
        sin = deltaY / distance;

      const sourceX = source.x - sourceRadius * cos,
        sourceY = source.y - sourceRadius * sin,
        targetX = target.x + targetRadius * cos,
        targetY = target.y + targetRadius * sin;
      return `M${sourceX},${sourceY} L${targetX},${targetY}`;
    });

    particle$.attr("transform", (d) => `translate(${d.x}, ${d.y})`);
  }

  return sim;
}
