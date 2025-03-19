import { ChatOpenAI } from "@langchain/openai";
import { PostgresSaver } from "@langchain/langgraph-checkpoint-postgres";
import pg from "pg";
import {
  MessagesAnnotation,
  START,
  StateGraph,
  END,
} from "@langchain/langgraph";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { RunnableConfig } from "@langchain/core/runnables";

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const checkpointer = new PostgresSaver(pool);
await checkpointer.setup();

const model = new ChatOpenAI({
  model: "gpt-4o-mini",
});

const agent = createReactAgent({
  tools: [],
  llm: new ChatOpenAI({
    model: "gpt-4o-mini",
  }),
  checkpointer,
});

const config2 = { configurable: { thread_id: "1" } };
const callModel = async (
  state: typeof MessagesAnnotation.State,
  config: RunnableConfig
) => {
  const { messages } = state;
  console.log(config?.configurable?.thread_id);

  const response = await agent.invoke(
    { messages },
    { configurable: { thread_id: config?.configurable?.thread_id } }
  );
  return { messages: [response.messages[response.messages.length - 1]] };

  // const response = await model.invoke(messages, {
  //   configurable: { thread_id: config?.configurable?.thread_id },
  // });
  // return { messages: [response] };
};

const workflow = new StateGraph(MessagesAnnotation)
  .addNode("agent", callModel)
  .addEdge(START, "agent")
  .addEdge("agent", END);

// export const graph = workflow.compile({ checkpointer });
export const graph = workflow.compile({});
