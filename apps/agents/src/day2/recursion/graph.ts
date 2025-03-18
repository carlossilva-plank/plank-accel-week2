import { StateGraph, Annotation } from "@langchain/langgraph";

// Define the state with a reducer
const StateAnnotationWithLoops = Annotation.Root({
  aggregate: Annotation<string[]>({
    reducer: (a, b) => a.concat(b),
    default: () => [],
  }),
});

// Define nodes
const nodeA = async function (state: typeof StateAnnotationWithLoops.State) {
  console.log(`Node A sees ${state.aggregate}`);
  return { aggregate: ["A"] };
}

const nodeB = async function (state: typeof StateAnnotationWithLoops.State) {
  console.log(`Node B sees ${state.aggregate}`);
  return { aggregate: ["B"] };
}

const nodeC = async function (state: typeof StateAnnotationWithLoops.State) {
  console.log(`Node C sees ${state.aggregate}`);
  return { aggregate: ["C"] };
}

const nodeD = async function (state: typeof StateAnnotationWithLoops.State) {
  console.log(`Node D sees ${state.aggregate}`);
  return { aggregate: ["D"] };
}

// Define edges
const loopRouter = async function (state: typeof StateAnnotationWithLoops.State) {
  console.log(`Loop router count, ${state.aggregate.length}`);
  if (state.aggregate.length < 7) {
    return "b";
  } else {
    return "__end__";
  }
}

// Define the graph
const graphWithLoops = new StateGraph(StateAnnotationWithLoops)
  .addNode("a", nodeA)
  .addNode("b", nodeB)
  .addNode("c", nodeC)
  .addNode("d", nodeD)
  .addEdge("__start__", "a")
  .addConditionalEdges("a", loopRouter)
  .addEdge("b", "c")
  .addEdge("b", "d")
  .addEdge(["c", "d"], "a")
  .compile();

export const graph = graphWithLoops;
