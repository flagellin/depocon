import { nodeIdsToLinkId } from "./nodeIdsToLinkId";
import { uniqBy, zip } from "lodash";

export type Dep = {
  id: string; // "path.to.module"
  imports?: string[]; // ["path.to.library1", "path.to.library2"]
};

export type Node = {
  id: string;
  name: string;
  type: "plain" | "group";
  includeBothDirection?: boolean;
  children?: string[];
  parent?: string;
};

export type Origin = { sourceId: string; targetId: string };

export type Link = {
  id: string;
  source: string;
  target: string;

  // Case of 'both', source ascends to target ascii order.
  direction: "either" | "both";
  origins: Origin[];
};

/*
  Convert 'a.b.c' to ['a', 'a.b', 'a.b.c']
 */
export function splitId(id: string, separator: string) {
  return id
    .split(separator)
    .map((v, i, arr) => arr.slice(0, i + 1).join(separator));
}

function walkDeps(
  deps: Dep[],
  callback: (dep: Dep, node: Node, parentNode?: Node | null) => void,
  separator: string
) {
  deps.forEach((dep) => {
    let parent: null | Node = null;
    const groupIds = splitId(dep.id, separator);
    groupIds.forEach((groupId, index, { length }) => {
      const group: Node = {
        id: groupId,
        name: groupId.split(separator).pop(),
        type: "group",
      };
      if (parent) {
        group.parent = parent.id;
      }
      if (index === length - 1) {
        group.type = "plain";
      } else {
        group.children = [];
      }
      callback(dep, group, parent);
      parent = group;
    });
  });
}

function depsToNodes(deps: Dep[], separator: string): Node[] {
  const nodeMap = new Map<string, Node>();

  walkDeps(
    deps,
    (dep, node, parent) => {
      if (!nodeMap.has(node.id)) nodeMap.set(node.id, node);

      if (parent) {
        const parentNode =
          nodeMap.get(parent.id) ||
          nodeMap.set(parent.id, parent).get(parent.id);
        if (parentNode.type === "plain") {
          parentNode.type = "group";
          parentNode.children = [];
        }
        parentNode.children.push(node.id);
      }
    },
    separator
  );

  return [...nodeMap.values()].map((node) =>
    node.children
      ? {
          ...node,
          children: [...new Set(node.children)], // Make unique
        }
      : node
  );
}

const originToUnique = (o: Origin) => `${o.sourceId}/${o.targetId}`;

class LinkMap extends Map<string, Link> {
  public setOrMerge(key: string, link: Link): this {
    const prev = this.get(key);
    if (!prev) {
      return this.set(key, link);
    }

    const origins = uniqBy(prev.origins.concat(link.origins), originToUnique);
    if (
      // Case that prev includes link.
      prev.direction === "both" ||
      // Case that prev includes link.
      (prev.source === link.source && prev.target === link.target)
    ) {
      return this.set(key, {
        ...prev,
        origins,
      });
    }

    if (
      prev.source === link.target &&
      prev.target === link.source &&
      prev.direction === "either"
    ) {
      // Case that prev does not include link.
      const [source, target] = [link.target, link.source].sort();
      return this.set(key, {
        id: key,
        source,
        target,
        direction: "both",
        origins,
      });
    }

    throw new Error(JSON.stringify({ prev, link }, null, 2));
  }
}

function depsToLinks(deps: Dep[], nodes: Node[], separator: string): Link[] {
  const linkMap: LinkMap = new LinkMap();

  walkDeps(
    deps,
    (dep) => {
      const sources = splitId(dep.id, separator);

      dep.imports?.forEach((targetId) => {
        const targets = splitId(targetId, separator);
        targets.forEach((target) => {
          sources.forEach((source) => {
            if (source.includes(target) || target.includes(source)) return;
            const linkId = nodeIdsToLinkId(source, target);
            linkMap.setOrMerge(linkId, {
              id: linkId,
              source,
              target,
              direction: "either",
              origins: [{ sourceId: dep.id, targetId }],
            });
          });
        });
      });
    },
    separator
  );

  return [...linkMap.values()];
}

function walkNode(
  nodeId: string,
  nodeMap: Map<string, Node>,
  cb: (node: Node) => void
) {
  const node = nodeMap.get(nodeId);
  if (!node) throw new Error();
  cb(node);
  node.children?.forEach((childId) => {
    walkNode(childId, nodeMap, cb);
  });
}

export function depsToModel(
  deps: Dep[],
  separator: string = "."
): {
  nodes: Node[];
  links: Link[];
} {
  const nodes: Node[] = depsToNodes(deps, separator),
    links: Link[] = depsToLinks(deps, nodes, separator);

  const nodeMap = new Map(nodes.map((n) => [n.id, n]));

  links.forEach(({ source, target, direction }) => {
    if (direction === "both") {
      const commonParents: string[] = [];
      for (const [src, tgt] of zip(
        source.split(separator),
        target.split(separator)
      )) {
        if (src === tgt) commonParents.push(src);
        else break;
      }
      const commonNodeId = commonParents.join(separator);
      if (commonNodeId) {
        const node = nodeMap.get(commonNodeId);
        if (!node) {
          console.log({ source, target, commonNodeId });
        }
        node.includeBothDirection = true;
      }
    }
  });
  const nodesDesc: Node[] = [];
  nodes
    .filter((n) => !n.parent)
    .forEach((topNode) =>
      walkNode(topNode.id, nodeMap, (n) => nodesDesc.push(n))
    );
  nodesDesc.reverse().forEach((node) => {
    if (!node.includeBothDirection) {
      node.includeBothDirection = node.children?.some((childId) => {
        const child = nodeMap.get(childId);
        return child.includeBothDirection;
      });
    }
  });

  return { links, nodes };
}
