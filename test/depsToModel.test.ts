import { Dep, depsToModel, Link, Node, splitId } from "../src/depsToModel";
import { nodeIdsToLinkId } from "../src/nodeIdsToLinkId";

function assertAs<T>(v): T {
  return v;
}
const idAsc = <T extends { id: string }>(a: T, b: T) => (a.id > b.id ? 1 : -1);

describe("depsToModel", () => {
  test("splitId", () => {
    expect(splitId("a.b.c")).toEqual(["a", "a.b", "a.b.c"]);
  });

  test("Normal", () => {
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

    const { nodes, links } = depsToModel(deps);
    expect(nodes.sort(idAsc)).toEqual<Node[]>([
      {
        id: "lib",
        name: "lib",
        type: "group",
        children: ["lib.a", "lib.b"],
      },
      {
        id: "lib.a",
        name: "a",
        type: "plain",
        parent: "lib",
      },
      {
        id: "lib.b",
        name: "b",
        type: "plain",
        parent: "lib",
      },
      {
        id: "main",
        name: "main",
        type: "plain",
      },
    ]);

    expect(links.sort(idAsc)).toEqual<Link[]>([
      { id: "lib-main", source: "main", target: "lib", direction: "either" },
      {
        id: "lib.a-lib.b",
        source: "lib.a",
        target: "lib.b",
        direction: "both",
      },
      {
        id: "lib.a-main",
        source: "main",
        target: "lib.a",
        direction: "either",
      },
      {
        id: "lib.b-main",
        source: "main",
        target: "lib.b",
        direction: "either",
      },
    ]);
  });

  test("Like __init__.py deps", () => {
    const { nodes } = depsToModel([
      { id: "app", imports: ["app.test"] },
      { id: "app.test", imports: [] },
    ]);
    expect(nodes).toMatchObject([
      {
        id: "app",
        type: "group",
        children: ["app.test"],
      },
      {
        id: "app.test",
        type: "plain",
        parent: "app",
      },
    ]);
  });

  const bothLink = (a: string, b: string) => {
    const [source, target] = [a, b].map((v) => v.split(" ").join("")).sort();
    return {
      id: nodeIdsToLinkId(source, target),
      source,
      target,
      direction: "both",
    };
  };
  const eitherLink = (source: string, target: string) => {
    return {
      id: nodeIdsToLinkId(source, target),
      source,
      target,
      direction: "either",
    };
  };

  test("Deep Links ", () => {
    const { links } = depsToModel([
      { id: "a.b", imports: ["x.y"] },
      { id: "x.y", imports: ["a.b"] },
    ]);
    expect(links.sort(idAsc)).toEqual<Link[]>(
      assertAs<Link[]>([
        bothLink("a.b", "x.y"),
        bothLink("a.b", "x  "),
        bothLink("a  ", "x.y"),
        bothLink("a", "x"),
      ]).sort(idAsc)
    );
  });

  test("Deeper Links ", () => {
    const { links } = depsToModel([
      { id: "a.b.c", imports: ["x.y.z"] },
      { id: "x.y.z", imports: ["a.b.c"] },
    ]);
    expect(links.sort(idAsc)).toEqual<Link[]>(
      assertAs<Link[]>([
        bothLink("a.b.c", "x.y.z"),
        bothLink("a.b  ", "x.y.z"),
        bothLink("a    ", "x.y.z"),
        bothLink("a.b.c", "x.y  "),
        bothLink("a.b.c", "x    "),
        bothLink("a.b", "x.y"),
        bothLink("a  ", "x.y"),
        bothLink("a.b", "x"),
        bothLink("a", "x"),
      ]).sort(idAsc)
    );
  });

  test("Multi imports", () => {
    const { links } = depsToModel([
      { id: "a.b1", imports: ["x", "a.b2"] },
      { id: "a.b2", imports: [] },
      { id: "x", imports: [] },
    ]);
    expect(links.sort(idAsc)).toEqual<Link[]>(
      assertAs<Link[]>([
        eitherLink("a.b1", "x"),
        eitherLink("a.b1", "a.b2"),
        eitherLink("a", "x"),
      ]).sort(idAsc)
    );
  });
});
