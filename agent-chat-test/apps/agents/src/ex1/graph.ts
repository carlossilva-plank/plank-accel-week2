// npm install @langchain-anthropic
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { tool } from "@langchain/core/tools";

import { z } from "zod";
import { MessagesAnnotation, StateGraph } from "@langchain/langgraph";
import { END } from "@langchain/langgraph";
import { RunnableConfig } from "@langchain/core/runnables";
import { ChatOpenAI } from "@langchain/openai";

const search = tool(
  async ({ query }) => {
    if (
      query.toLowerCase().includes("sf") ||
      query.toLowerCase().includes("san francisco")
    ) {
      return "It's 60 degrees and foggy.";
    }
    return "It's 90 degrees and sunny.";
  },
  {
    name: "search",
    description: "Call to surf the web.",
    schema: z.object({
      query: z.string().describe("The query to use in your search."),
    }),
  }
);

const model = new ChatOpenAI({
  model: "gpt-4o-mini",
});

const agent = createReactAgent({
  llm: model,
  tools: [search],
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
  .addEdge("__start__", "callModel")
  .addEdge("callModel", END);

export const graph = workflow.compile();
