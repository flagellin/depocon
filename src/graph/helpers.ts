import { Particle } from "../modelToViewModel";
import { Selection } from "d3";
import { particleRadiusUnit } from "./particleVariables";

export function particleId(p: Particle) {
  return `particle-${p.id}`.split(".").join("-");
}

export type RootSelection = Selection<
  SVGGElement,
  undefined,
  undefined,
  undefined
>;

export function particleRadius(p: Particle) {
  return p.isField ? p.radius : particleRadiusUnit;
}

export const directionColor: { [key in "both" | "either"]: string } = {
  both: "red",
  either: "green",
};
export const directionWidth: { [key in "both" | "either"]: number } = {
  both: 3,
  either: 1,
};
