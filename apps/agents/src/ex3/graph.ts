import { RunnableConfig } from "@langchain/core/runnables";
import {
  StateGraph,
  Annotation,
  MessagesAnnotation,
} from "@langchain/langgraph";
import { ChatOpenAI } from "@langchain/openai";

// Graph state
const StateAnnotation = Annotation.Root({
  ...MessagesAnnotation.spec,
  topic: Annotation<string>,
  joke: Annotation<string>,
  improvedJoke: Annotation<string>,
  finalJoke: Annotation<string>,
});

const llm = new ChatOpenAI({ model: "gpt-4o-mini" });

// Define node functions

// First LLM call to generate initial joke
async function generateJoke(
  state: typeof StateAnnotation.State,
  config: RunnableConfig
) {
  const msg = await llm.invoke(
    `Write a short joke about ${state.topic}`,
    config
  );
  return { joke: msg.content };
}

// Gate function to check if the joke has a punchline
function checkPunchline(state: typeof StateAnnotation.State) {
  // Simple check - does the joke contain "?" or "!"
  if (state.joke?.includes("?") || state.joke?.includes("!")) {
    return "Pass";
  }
  return "Fail";
}

// Second LLM call to improve the joke
async function improveJoke(
  state: typeof StateAnnotation.State,
  config: RunnableConfig
) {
  const msg = await llm.invoke(
    `Make this joke funnier by adding wordplay: ${state.joke}`,
    config
  );
  return { improvedJoke: msg.content };
}

// Third LLM call for final polish
async function polishJoke(
  state: typeof StateAnnotation.State,
  config: RunnableConfig
) {
  const msg = await llm.invoke(
    `Add a surprising twist to this joke: ${state.improvedJoke}`,
    config
  );
  return { output: msg.content };
}

// Build workflow
const chain = new StateGraph(StateAnnotation)
  .addNode("generateJoke", generateJoke)
  .addNode("improveJoke", improveJoke)
  .addNode("polishJoke", polishJoke)
  .addEdge("__start__", "generateJoke")
  .addConditionalEdges("generateJoke", checkPunchline, {
    Pass: "improveJoke",
    Fail: "__end__",
  })
  .addEdge("improveJoke", "polishJoke")
  .addEdge("polishJoke", "__end__");

export const graph = chain.compile();
