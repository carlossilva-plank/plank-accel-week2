import { HumanMessage, RemoveMessage } from "@langchain/core/messages";
import { RunnableConfig } from "@langchain/core/runnables";
import {
  StateGraph,
  Annotation,
  MessagesAnnotation,
} from "@langchain/langgraph";
import { ChatOpenAI } from "@langchain/openai";

const StateAnnotation = Annotation.Root({
  topic: Annotation<string>,
  joke: Annotation<string>,
  improvedJoke: Annotation<string>,
  finalJoke: Annotation<string>,
  summary: Annotation<string>,
  ...MessagesAnnotation.spec,
});

type State = typeof StateAnnotation.State;
const llm = new ChatOpenAI({ model: "gpt-4o-mini" });

async function generateJoke(
  state: typeof StateAnnotation.State,
  config: RunnableConfig
) {
  if (!state.topic) {
    const lastMessage = state.messages?.at(-1)?.content;
    state.topic = lastMessage as string;
  }

  const msg = await llm.invoke(
    `Write a short joke about ${state.topic}`,
    config
  );
  return { messages: [msg] };
}

async function summarizeConversation(state: State) {
  const summary = state.summary || "";

  // Create our summarization prompt
  let summaryMessage: string;
  if (summary) {
    summaryMessage =
      `This is a summary of the conversation to date: ${summary}\n\n` +
      "Extend the summary by taking into account the new messages above:";
  } else {
    summaryMessage = "Create a summary of the conversation above:";
  }

  // Add prompt to our history
  const messages = [
    ...state.messages,
    new HumanMessage({ content: summaryMessage }),
  ];

  const response = await llm.invoke(messages);
  const deleteMessages = state.messages
    .slice(0, -2)
    .map((m) => new RemoveMessage({ id: m.id as string }));

  console.log(response.content);

  return {
    summary: response.content,
    messages: deleteMessages,
  };
}

const chain = new StateGraph(StateAnnotation)
  .addNode("generateJoke", generateJoke)
  .addNode("summarizeConversation", summarizeConversation)
  .addEdge("__start__", "generateJoke")
  .addEdge("generateJoke", "summarizeConversation")
  .addEdge("summarizeConversation", "__end__");

export const graph = chain.compile();
