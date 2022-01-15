import { Dep, depsToModel } from "../src/depsToModel";
import {
  Fiber,
  FieldParticle,
  modelToViewModel,
  Particle,
} from "../src/modelToViewModel";

function assertAs<T>(v): T {
  return v;
}
describe("Test modelToViewModel", function () {
  const deps: Dep[] = [
    {
      id: "main",
      imports: ["lib.a", "lib.b"],
    },
    {
      id: "lib.a",
      imports: ["lib.b"],
    },
    {
      id: "lib.b",
      imports: ["lib.a"],
    },
  ];

  const expectationOfExpanded /*: Partial<FieldParticle> */ = {
    particles: assertAs<Partial<Particle>[]>([
      {
        id: "main",
        name: "main",
      },
      {
        id: "lib",
        isField: true,
        particles: [
          {
            id: "lib.a",
            name: "a",
          },
          {
            id: "lib.b",
            name: "b",
          },
        ],
        fibers: assertAs<Partial<Fiber>[]>([
          {
            id: "lib.a-lib.b",
            direction: "both",
            source: { id: "lib.a" },
            target: { id: "lib.b" },
          },
        ]),
      },
    ]),
    fibers: [
      {
        id: "lib-main",
        direction: "either",
        source: { id: "main" },
        target: { id: "lib" },
      },
    ],
  };
  const expectationOfCollapsed: Partial<FieldParticle> = {
    particles: assertAs<Partial<Particle[]>>([
      {
        id: "main",
        name: "main",
      },
      {
        id: "lib",
        name: "lib",
        isField: true,
        particles: [],
        fibers: [],
      },
    ]),
    fibers: assertAs<Partial<Fiber[]>>([
      {
        id: "lib-main",
        direction: "either",
        source: { id: "main" },
        target: { id: "lib" },
      },
    ]),
  };
  /*
  main
  lib
    |- a
    |- b
   */

  test("Expanded", () => {
    const { nodes, links } = depsToModel(deps);
    const field = modelToViewModel(nodes, links, new Set(["lib"]));
    expect(field).toMatchObject(
      /*<Partial<FieldParticle>>*/ expectationOfExpanded
    );

    const libField = field.particles[1],
      libA = libField.isField ? libField?.particles[0] : null,
      libB = libField.isField ? libField?.particles[1] : null,
      fiber = libField.isField ? libField.fibers[0] : null;
    expect(libA).toBe(fiber.source);
    expect(libB).toBe(fiber.target);
  });

  test("Merge", () => {
    const { nodes, links } = depsToModel(deps);
    const field1 = modelToViewModel(nodes, links, new Set());
    const field2 = modelToViewModel(nodes, links, new Set(["lib"]), field1);
    expect(field2).toMatchObject(expectationOfExpanded);
    {
      const libField = field2.particles[1],
        libA = libField.isField ? libField?.particles[0] : null,
        libB = libField.isField ? libField?.particles[1] : null,
        fiber = libField.isField ? libField.fibers[0] : null;
      expect(libA).toBe(fiber.source);
      expect(libB).toBe(fiber.target);
    }
    const field3 = modelToViewModel(nodes, links, new Set([]), field2);
    expect(field3).toMatchObject(expectationOfCollapsed);
  });

  test("Collapsed", () => {
    const { nodes, links } = depsToModel(deps);
    const field = modelToViewModel(nodes, links, new Set());
    expect(field).toMatchObject<Partial<FieldParticle>>(expectationOfCollapsed);
  });
});
