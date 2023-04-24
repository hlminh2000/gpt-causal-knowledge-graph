import "@tensorflow/tfjs";
import USE from "@tensorflow-models/universal-sentence-encoder";
import _ from "lodash";
import { v4 as uuidV4 } from "uuid";
import { Configuration, OpenAIApi } from "openai";
import { causePrompt, contextPrompt, initialQuestionPrompt } from "./prompts";
import { consolidateGraph, mergeGraphs } from "./knowledgeGraphUtils";

export type KnowledgeGraphNode = {
  id: string;
  text: string;
  embeddings: any;
  variations: KnowledgeGraphNode[];
};
export type KnowledgeGraph = {
  nodes: KnowledgeGraphNode[];
  edges: {
    cause: KnowledgeGraphNode["id"];
    effect: KnowledgeGraphNode["id"];
  }[];
};

const getSentenceEmbeddingModel = _.memoize(() => USE.load());

export const newKnowledgeGraphModel = (config: {
  openAiConfiguration: Configuration;
}) => {
  const openai = new OpenAIApi(config.openAiConfiguration);

  const getEmbeddings = async (text: string) => {
    const sentenceEmbeddingModel = await getSentenceEmbeddingModel();
    const output = await sentenceEmbeddingModel
      .embed([text])
      .then((embeddings) => embeddings.array())
      .then(([array]) => array);
    console.log("output: ", output);
    return output;
  };

  const executePrompt = async (
    storyText: string,
    promptText: string,
    n = 1
  ) => {
    const output = await openai.createChatCompletion({
      model: "gpt-3.5-turbo",
      temperature: 0.7,
      n,
      messages: [
        {
          role: "system",
          content: contextPrompt(storyText),
        },
        {
          role: "user",
          content: promptText,
        },
      ],
    });
    return output;
  };

  const isStory = async (storyText: string) => {
    const modelResponse = await executePrompt(
      storyText,
      "does this text describe a story? yes or no."
    );
    return (
      modelResponse.data.choices
        .at(0)
        ?.message?.content.toLowerCase()
        .indexOf("yes") === 0
    );
  };

  const getEndingNode = async (
    storyText: string,
    initialPrompt: string
  ): Promise<KnowledgeGraphNode> => {
    const promptResult = await executePrompt(
      storyText,
      initialQuestionPrompt(initialPrompt)
    );
    const resultText = promptResult.data.choices[0]?.message?.content || "";
    return {
      id: uuidV4(),
      embeddings: await getEmbeddings(resultText),
      text: resultText,
      variations: [],
    };
  };

  const generateCausesForNode = async (arg: {
    storyText: string;
    node: KnowledgeGraphNode;
  }): Promise<KnowledgeGraphNode[]> => {
    const { node, storyText } = arg;
    const promptResult = await executePrompt(
      storyText,
      causePrompt(node.text),
      2
    );
    return Promise.all(
      promptResult.data.choices.map(async (choice) => ({
        id: uuidV4(),
        embeddings: await getEmbeddings(choice.message?.content || ""),
        text: choice.message?.content || "",
        variations: [],
      }))
    );
  };

  const expandGraph = async (arg: {
    graph: KnowledgeGraph;
    node: KnowledgeGraphNode;
    storyText: string;
    onUpdate?: (graph: KnowledgeGraph) => void;
  }): Promise<KnowledgeGraph> => {
    const { graph, node, storyText, onUpdate } = arg;

    if (graph.nodes.length >= 10) return graph;

    const newNodes = await generateCausesForNode({ storyText, node });
    const subGraphs = newNodes.map((_node) => ({
      nodes: [_node, node],
      edges: [{ cause: _node.id, effect: node.id }],
    }));
    const mergedGraph = mergeGraphs([graph, ...subGraphs]);
    onUpdate?.(mergedGraph);
    const expandedGraph = await expandGraph({
      graph: mergedGraph,
      node: newNodes[0],
      storyText,
      onUpdate,
    });
    const consolidatedGraph = consolidateGraph(expandedGraph);
    return consolidatedGraph;
  };

  const createKnowledgeGraph = async (args: {
    storyText: string;
    initialPrompt: string;
    onUpdate?: (graph: KnowledgeGraph) => void;
  }): Promise<KnowledgeGraph> => {
    const { initialPrompt, storyText, onUpdate } = args;
    const knowledgeGraph: KnowledgeGraph = {
      nodes: [],
      edges: [],
    };

    if (!(await isStory(storyText)))
      throw new Error("The text does not contain a story");

    const endingNode = await getEndingNode(storyText, initialPrompt);
    return expandGraph({
      graph: knowledgeGraph,
      node: endingNode,
      storyText,
      onUpdate,
    });
  };

  return {
    createKnowledgeGraph,
  };
};
