import { InMemoryStore } from "@langchain/langgraph";
import { v4 as uuidv4 } from "uuid";
import { BaseMessage } from "@langchain/core/messages";
import {
  Annotation,
  StateGraph,
  START,
  MemorySaver,
  LangGraphRunnableConfig,
  messagesStateReducer,
} from "@langchain/langgraph";
import { ChatOpenAI } from "@langchain/openai";
const inMemoryStore = new InMemoryStore();

const StateAnnotation = Annotation.Root({
  messages: Annotation<BaseMessage[]>({
    reducer: messagesStateReducer,
    default: () => [],
  }),
});

const model = new ChatOpenAI({ modelName: "gpt-4o-mini" });

// NOTE: we're passing the Store param to the node --
// this is the Store we compile the graph with
const callModel = async (
  state: typeof StateAnnotation.State,
  config: LangGraphRunnableConfig
): Promise<{ messages: any }> => {
  const store = config.store;
  if (!store) {
    if (!store) {
      throw new Error("store is required when compiling the graph");
    }
  }
  if (!config.configurable?.userId) {
    config.configurable!.userId = "carlos";
    // config.configurable!.userId = "teste";
    // throw new Error("userId is required in the config");
  }
  const namespace = ["memories", config.configurable?.userId];
  const memories = await store.search(namespace);
  const info = memories.map((d) => d.value.data).join("\n");
  const systemMsg = `You are a helpful assistant talking to the user. User info: ${info}`;

  // Store new memories if the user asks the model to remember
  const lastMessage = state.messages[state.messages.length - 1];
  if (
    typeof lastMessage.content === "string" &&
    lastMessage.content.toLowerCase().includes("remember")
  ) {
    const memoryId = uuidv4();
    await store.put(namespace, memoryId, { data: lastMessage.content });
    console.log("lastMessage.content");
  }
  console.log(await store.search(namespace));

  const response = await model.invoke([
    { type: "system", content: systemMsg },
    ...state.messages,
  ]);
  return { messages: response };
};

const builder = new StateGraph(StateAnnotation)
  .addNode("call_model", callModel)
  .addEdge(START, "call_model");

// NOTE: we're passing the store object here when compiling the graph
export const graph = builder.compile({
  checkpointer: new MemorySaver(),
  store: inMemoryStore,
});

// If you're using LangGraph Cloud or LangGraph Studio, you don't need to pass the store or checkpointer when compiling the graph, since it's done automatically.
