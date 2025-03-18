import { Annotation, Command, StateGraph } from "@langchain/langgraph";

// Define graph state
const StateAnnotation = Annotation.Root({
  foo: Annotation<string>,
});

// Define the nodes

// Nodes B and C are unchanged
const nodeB = async (state: typeof StateAnnotation.State) => {
  console.log("Called B");
  return {
    foo: state.foo + "|b",
  };
};

const nodeC = async (state: typeof StateAnnotation.State) => {
  console.log("Called C");
  return {
    foo: state.foo + "|c",
  };
};

// Define the nodes
const nodeASubgraph = async (_state: typeof StateAnnotation.State) => {
  console.log("Called A");
  // this is a replacement for a real conditional edge function
  const goto = Math.random() > 0.5 ? "nodeB" : "nodeC";
  // note how Command allows you to BOTH update the graph state AND route to the next node
  return new Command({
    update: {
      foo: "a",
    },
    goto,
    // this tells LangGraph to navigate to node_b or node_c in the parent graph
    // NOTE: this will navigate to the closest parent graph relative to the subgraph
    graph: Command.PARENT,
  });
};

const subgraph = new StateGraph(StateAnnotation)
  .addNode("nodeA", nodeASubgraph)
  .addEdge("__start__", "nodeA")
  .compile();

const parentGraph = new StateGraph(StateAnnotation)
  .addNode("subgraph", subgraph, { ends: ["nodeB", "nodeC"] })
  .addNode("nodeB", nodeB)
  .addNode("nodeC", nodeC)
  .addEdge("__start__", "subgraph");

export const graph = parentGraph.compile();
