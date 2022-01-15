import { Dep } from "../src/depsToModel";
import { values } from "lodash";

export const deps1: Dep[] = [
  {
    id: "main",
    imports: ["lib1.a", "lib1.b", "lib2.a"],
  },
  {
    id: "lib1.a",
    imports: ["lib1.b"],
  },
  { id: "lib1.b", imports: ["lib2.a"] },
  { id: "lib2.a", imports: ["lib2.b", "lib2.c"] },
  { id: "lib2.b" },
  { id: "lib2.c", imports: ["lib1.a"] },
];

export const deps2: Dep[] = [
  {
    id: "lib.helper1",
    imports: [],
  },
  {
    id: "lib.helper2",
    imports: [],
  },
  {
    id: "lib.helper3",
    imports: [],
  },
  {
    id: "app1.function1",
  },
  {
    id: "app1.main",
    imports: ["lib.helper1", "app1.function1", "app2.function1"],
  },
  {
    id: "app1.models.user",
  },
  {
    id: "app1.models.group",
  },
  {
    id: "app2.main",
    imports: ["lib.helper2", "app1.function1", "app2.function1"],
  },
  {
    id: "app2.function1",
    imports: [],
  },
];

export const deps3: Dep[] = [
  { id: "a.b", imports: ["x.y"] },
  { id: "x.y", imports: ["a.b"] },
];
