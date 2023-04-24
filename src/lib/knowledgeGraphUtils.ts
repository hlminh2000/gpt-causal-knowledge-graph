import "@tensorflow/tfjs";
import _, { clone } from "lodash";
import distance from "euclidean-distance";
import combinations from "combinations";
import { KnowledgeGraph, KnowledgeGraphNode } from "./knowledgeGraph";

export const consolidateGraph = (
  knowledgeGraph: KnowledgeGraph
): KnowledgeGraph => {
  const clonedGraph = clone(knowledgeGraph);

  const nodePairs = combinations(knowledgeGraph.nodes, 2, 2).filter(
    ([node1, node2]) => node1.id === node2.id
  ) as [KnowledgeGraphNode, KnowledgeGraphNode][];

  const removedNodes: { [nodeId: string]: boolean } = {};
  nodePairs.forEach(([node1, node2]) => {
    const differenceScore = distance(node1.embeddings, node2.embeddings);
    console.log("===========================================");
    console.log(node1.text);
    console.log(node2.text);
    console.log("differenceScore: ", differenceScore);
    if (false && removedNodes[node1.id]) {
      node1.variations.push(node2);
      clonedGraph.nodes = clonedGraph.nodes.filter((n) => n.id !== node2.id);
      clonedGraph.edges.forEach((edge) => {
        if (edge.cause === node2.id) edge.cause = node1.id;
        if (edge.effect === node2.id) edge.effect = node1.id;
        removedNodes[node2.id] = true;
      });
    }
  });

  return clonedGraph;
};

export const mergeGraphs = (graphs: KnowledgeGraph[]): KnowledgeGraph => ({
  nodes: _(graphs)
    .map((g) => g.nodes)
    .flattenDeep()
    .uniqBy("id")
    .value(),
  edges: _(graphs)
    .map((g) => g.edges)
    .flattenDeep()
    .uniqBy((edge) => `${edge.cause}:${edge.effect}`)
    .value(),
});
