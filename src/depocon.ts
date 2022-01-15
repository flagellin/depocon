import { Dep, depsToModel, Link, Node } from "./depsToModel";
import * as d3 from "d3";
import { FieldParticle, modelToViewModel, Particle } from "./modelToViewModel";
import { createSvg } from "./graph/createSvg";
import { transform } from "lodash";
import { applySimulation } from "./graph/applySimulation";
import { RootSelection } from "./graph/helpers";
import { joinField } from "./graph/joinField";

type Deps = Dep[];

function resetVelocity(f: FieldParticle) {
  f.particles?.forEach((p) => {
    p.vx = p.vy = 0;
    if (p.isField) resetVelocity(p);
  });
}

function walkField(p: Particle, cb: (p: Particle) => void) {
  if (p.isField) {
    p.particles.forEach((child) => {
      cb(child);
      walkField(child, cb);
    });
  }
}

function* createRunner({
  svg,
  links,
  nodes,
}: {
  svg: RootSelection;
  links: Link[];
  nodes: Node[];
}): Iterator<undefined, void, string> {
  const expansions = new Set<string>();
  let field = modelToViewModel(nodes, links, expansions);

  const root = svg
    .style("cursor", "crosshair")
    .call(
      d3.zoom().on("zoom", (e) => {
        root.attr("transform", e.transform);
      })
    )
    .append("g");
  while (1) {
    root.call(joinField, [field], true);
    const simulationFields = [field];
    walkField(field, (p) => {
      if (expansions.has(p.id)) {
        if (!p.isField) throw new Error();
        simulationFields.push(p);
      }
    });
    const sims = simulationFields.map((f) => {
      return applySimulation(root, f);
    });

    const toggledFieldId = yield; // Catch toggle event

    sims.forEach((sim) => {
      sim.nodes([]);
      sim.on("tick");
      sim.stop();
    });

    if (expansions.has(toggledFieldId)) expansions.delete(toggledFieldId);
    else expansions.add(toggledFieldId);

    field = modelToViewModel(nodes, links, expansions, field);
    resetVelocity(field);
  }
}

export function Depocon(deps: Deps) {
  const { links, nodes } = depsToModel(deps);
  const svg = createSvg();

  const runner = createRunner({ svg, nodes, links });
  runner.next();

  const container = document.createElement("div"),
    tooltip = document.createElement("pre");
  {
    const style = tooltip.style;
    style.position = "absolute";
    style.top = "0";
    style.right = "0";
    style.bottom = "0";
    style.fontFamily =
      "ui-monospace,SFMono-Regular,SF Mono,Menlo,Consolas,Liberation Mono,monospace"; // Github
    style.fontSize = "12px";
    style.overflow = "auto";
    style.display = "none";
    style.border = "1px solid red";
    style.backgroundColor = "#f7EEEE";
    style.padding = "10px";
  }

  svg.on("click", (e: MouseEvent) => {
    const el: Element = e.target as never;
    if (
      el.classList.contains("fiber") &&
      el.classList.contains("both-direction")
    ) {
      tooltip.style.display = "block";
      tooltip.textContent =
        el.attributes.getNamedItem("data-message").textContent || "";
    } else if (el.classList.contains("field-title")) {
      const toggledFieldId =
        el.attributes.getNamedItem("data-field-id").textContent;
      if (!toggledFieldId) throw new Error();
      runner.next(toggledFieldId);
    } else {
      tooltip.style.display = "none";
    }
  }),
    container.append(svg.node(), tooltip);
  return container;
}
