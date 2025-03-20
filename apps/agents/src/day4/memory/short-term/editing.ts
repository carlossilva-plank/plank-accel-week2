import { RemoveMessage } from "@langchain/core/messages";
import { RunnableConfig } from "@langchain/core/runnables";
import {
  StateGraph,
  Annotation,
  MessagesAnnotation,
} from "@langchain/langgraph";
import { ChatOpenAI } from "@langchain/openai";
// Graph state
const StateAnnotation = Annotation.Root({
  topic: Annotation<string>,
  joke: Annotation<string>,
  improvedJoke: Annotation<string>,
  finalJoke: Annotation<string>,
  ...MessagesAnnotation.spec,
  // messages: Annotation<any[]>({
  //   reducer: (
  //     existing: string[],
  //     updates: string[] | { type: string; from: number; to?: number }
  //   ) => {
  //     if (Array.isArray(updates)) {
  //       // Normal case, add to the history
  //       return [...existing, ...updates];
  //     } else if (typeof updates === "object" && updates.type === "keep") {
  //       // You get to decide what this looks like.
  //       // For example, you could simplify and just accept a string "DELETE"
  //       // and clear the entire list.
  //       return existing.slice(updates.from, updates.to);
  //     }
  //     // etc. We define how to interpret updates
  //     return existing;
  //   },
  //   default: () => [],
  // }),
});

const llm = new ChatOpenAI({ model: "gpt-4o-mini" });

// First LLM call to generate initial joke
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
  // console.log("improveJoke", state);
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
  console.log(state.messages, state.messages.length);
  return { output: msg.content, messages: [msg] };
}

async function editMessages(state: typeof StateAnnotation.State) {
  const deleteMessages = state.messages
    .slice(0, -2)
    .map((m) => new RemoveMessage({ id: m.id as string }));

  return { messages: deleteMessages };
}

// Build workflow
const chain = new StateGraph(StateAnnotation)
  .addNode("generateJoke", generateJoke)
  .addNode("improveJoke", improveJoke)
  .addNode("polishJoke", polishJoke)
  .addNode("editMessages", editMessages)
  .addEdge("__start__", "generateJoke")
  .addConditionalEdges("generateJoke", checkPunchline, {
    Pass: "improveJoke",
    Fail: "__end__",
  })
  .addEdge("improveJoke", "polishJoke")
  .addEdge("polishJoke", "editMessages")
  .addEdge("editMessages", "__end__");

export const graph = chain.compile();
