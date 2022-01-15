import { Link, Node } from "./depsToModel";
import { nodeIdsToLinkId } from "./nodeIdsToLinkId";
import { SimulationLinkDatum, SimulationNodeDatum } from "d3";
import { zip } from "lodash";
import { particleRadius } from "./graph/helpers";
import {
  fieldMinPadding,
  fieldPaddingRatio,
  particleMargin,
  particleRadiusUnit,
} from "./graph/particleVariables";

export type Fiber = {
  id: string;
  direction: "either" | "both";
  sourceRadius?: number;
  targetRadius?: number;
  source: { id: string } & SimulationNodeDatum;
  target: { id: string } & SimulationNodeDatum;
  origins: { sourceId: string; targetId: string }[];
} & SimulationLinkDatum<{ id: string } & SimulationNodeDatum>;

export type FieldParticle = {
  id: string;
  isRoot?: boolean;
  name: string;
  isField: true;
  fibers: Fiber[];
  particles: Particle[];
  isExpanded: boolean;

  radius: number;
  includeBothDirection: boolean;
} & SimulationNodeDatum;

export type LeafParticle = {
  id: string;
  name: string;
  isField?: false;
} & SimulationNodeDatum;

export type Particle = FieldParticle | LeafParticle;

function makeFibers(
  linkMap: Map<string, Link>,
  particles: Particle[]
): Fiber[] {
  const linkIds = particles
    .map((p1, i) =>
      particles.slice(i + 1).map((p2) => {
        return nodeIdsToLinkId(p1.id, p2.id);
      })
    )
    .flat()
    .filter((linkId) => linkMap.has(linkId));
  const particleMap = new Map(particles.map((p) => [p.id, p]));
  return linkIds.map((linkId) => {
    const link = linkMap.get(linkId);
    const source = particleMap.get(link.source);
    const target = particleMap.get(link.target);
    return {
      id: link.id,
      direction: link.direction,
      source,
      target,
      origins: link.origins,
    };
  });
}

function makeFieldRecursively(
  nodeMap: Map<string, Node>,
  linkMap: Map<string, Link>,
  parentNode: Node,
  expansions: Set<string>,
  baseParticle?: FieldParticle
): FieldParticle {
  const isExpanded = expansions.has(parentNode.id);
  const particles: Particle[] =
    parentNode.type === "group" && isExpanded
      ? zip(parentNode.children || [], baseParticle?.particles).map(
          ([childId, baseChild]) => {
            const node = nodeMap.get(childId);
            if (node.type === "plain") {
              return baseChild?.id === node.id
                ? baseChild
                : { id: node.id, name: node.name };
            }
            return makeFieldRecursively(
              nodeMap,
              linkMap,
              node,
              expansions,
              baseChild?.isField ? baseChild : undefined
            );
          }
        )
      : [];

  const fibers = makeFibers(linkMap, particles);
  if (baseParticle) {
    baseParticle.particles = particles;
    baseParticle.fibers = fibers;
    baseParticle.radius = -1;
    baseParticle.isExpanded = isExpanded;
    return baseParticle;
  }

  return {
    id: parentNode.id,
    name: parentNode.name,
    isField: true,
    particles,
    fibers,
    isExpanded,
    radius: -1,
    includeBothDirection: parentNode.includeBothDirection,
  };
}

function calcRadius(particles: Particle[]): number {
  const sumArea = particles
    .map((child) => {
      if (child.isField) {
        if (-1 === child.radius) throw new Error();
        return child.radius;
      }
      return particleRadiusUnit;
    })
    .reduce((sum, num) => {
      return sum + (num + particleMargin) ** 2;
    }, 0);

  const baseRadius = Math.sqrt(sumArea);
  const padding = Math.max(fieldMinPadding, baseRadius * fieldPaddingRatio);
  return baseRadius + padding;
}

function modifyFieldUsingDescendants(
  f: FieldParticle,
  particleMap: Map<string, Particle>
) {
  f.radius = calcRadius(f.particles);
  f.fibers.forEach((f) => {
    f.sourceRadius = particleRadius(particleMap.get(f.source.id));
    f.targetRadius = particleRadius(particleMap.get(f.target.id));
  });
}

export function modelToViewModel(
  nodes: Node[],
  links: Link[],
  expansions: Set<string>,
  baseField?: FieldParticle
): FieldParticle {
  const nodeMap = new Map<string, Node>(nodes.map((v) => [v.id, v]));
  const linkMap = new Map<string, Link>(links.map((v) => [v.id, v]));

  const rootField = makeFieldRecursively(
    nodeMap,
    linkMap,
    {
      id: "__root__",
      name: "__root__",
      type: "group",
      children: nodes.filter((v) => v.parent === undefined).map((v) => v.id),
    },
    new Set(expansions).add("__root__"),
    baseField
  );
  rootField.isRoot = true;

  const particleMap = new Map<string, Particle>();
  const particlesByDesc: Particle[] = [];

  walkField(rootField, (p) => {
    particlesByDesc.push(p);
    particleMap.set(p.id, p);
  });
  particlesByDesc
    .reverse()
    .concat([rootField])
    .forEach((p) => {
      if (p.isField) {
        modifyFieldUsingDescendants(p, particleMap);
      }
    });
  return rootField;
}

function walkField(
  field: FieldParticle,
  callback: (particle: Particle, parent?: Particle) => void
) {
  field.particles.forEach((p) => {
    callback(p);
    if (p.isField) walkField(p, callback);
  });
}
