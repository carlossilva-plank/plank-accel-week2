import { END, START, StateGraph, Annotation } from "@langchain/langgraph";

const ConditionalBranchingAnnotation = Annotation.Root({
  aggregate: Annotation<string[]>({
    reducer: (x, y) => x.concat(y),
  }),
  which: Annotation<string>({
    reducer: (x: string, y: string) => y ?? x,
  }),
});

// Create the graph
const nodeA2 = (state: typeof ConditionalBranchingAnnotation.State) => {
  console.log(`Adding I'm A to ${state.aggregate}`);
  return { aggregate: [`I'm A`] };
};
const nodeB2 = (state: typeof ConditionalBranchingAnnotation.State) => {
  console.log(`Adding I'm B to ${state.aggregate}`);
  return { aggregate: [`I'm B`] };
};
const nodeC2 = (state: typeof ConditionalBranchingAnnotation.State) => {
  console.log(`Adding I'm C to ${state.aggregate}`);
  return { aggregate: [`I'm C`] };
};
const nodeD2 = (state: typeof ConditionalBranchingAnnotation.State) => {
  console.log(`Adding I'm D to ${state.aggregate}`);
  return { aggregate: [`I'm D`] };
};
const nodeE2 = (state: typeof ConditionalBranchingAnnotation.State) => {
  console.log(`Adding I'm E to ${state.aggregate}`);
  return { aggregate: [`I'm E`] };
};

// Define the route function
function routeCDorBC(
  state: typeof ConditionalBranchingAnnotation.State
): string[] {
  if (state.which === "cd") {
    return ["c", "d"];
  }
  return ["b", "c"];
}

const builder2 = new StateGraph(ConditionalBranchingAnnotation)
  .addNode("a", nodeA2)
  .addEdge(START, "a")
  .addNode("b", nodeB2)
  .addNode("c", nodeC2)
  .addNode("d", nodeD2)
  .addNode("e", nodeE2)
  // Add conditional edges
  // Third parameter is to support visualizing the graph
  .addConditionalEdges("a", routeCDorBC, ["b", "c", "d"])
  .addEdge("b", "e")
  .addEdge("c", "e")
  .addEdge("d", "e")
  .addEdge("e", END);

export const graph = builder2.compile();
