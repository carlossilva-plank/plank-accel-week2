// agent.ts

import { TavilySearchResults } from "@langchain/community/tools/tavily_search";
import { ChatOpenAI } from "@langchain/openai";
import {
  MemorySaver,
  MessagesAnnotation,
  StateGraph,
} from "@langchain/langgraph";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { RunnableConfig } from "@langchain/core/runnables";

// Define the tools for the agent to use
const agentTools = [new TavilySearchResults({ maxResults: 3 })];
const agentModel = new ChatOpenAI({ temperature: 0, model: "gpt-4o-mini" });

// Initialize memory to persist state between graph runs
const agentCheckpointer = new MemorySaver();
const agent = createReactAgent({
  llm: agentModel,
  tools: agentTools,
  checkpointSaver: agentCheckpointer,
});

async function callModel(
  state: typeof MessagesAnnotation.State,
  config: RunnableConfig
): Promise<typeof MessagesAnnotation.Update> {
  const result = await agent.invoke(state, config);

  return result;
}

const workflow = new StateGraph(MessagesAnnotation)
  .addNode("callModel", callModel)
  .addEdge("__start__", "callModel");

export const graph = workflow.compile();
