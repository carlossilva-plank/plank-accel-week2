import { ChatOpenAI, OpenAIEmbeddings } from "@langchain/openai";
import { InMemoryStore, StateGraph } from "@langchain/langgraph";
import { StateAnnotation } from "src/retrieval-agent/state.js";
// import "@tensorflow/tfjs-backend-cpu";
// import { TensorFlowEmbeddings } from "@langchain/community/embeddings/tensorflow";

// const embeddings = new TensorFlowEmbeddings({});

const store = new InMemoryStore({
  // index: {
  //   embeddings,
  //   dims: 128,
  // },
});

let namespace = ["user_123", "memories"];
let memoryKey = "favorite_food";
let memoryValue = { text: "I love pizza" };

await store.put(namespace, memoryKey, memoryValue);

await store.put(["user_123", "memories"], "italian_food", {
  text: "I prefer Italian food",
});
await store.put(["user_123", "memories"], "spicy_food", {
  text: "I don't like spicy food",
});
await store.put(["user_123", "memories"], "occupation", {
  text: "I am an airline pilot",
});

// That occupation is too lofty - let's overwrite
// it with something more... down-to-earth
await store.put(["user_123", "memories"], "occupation", {
  text: "I am a tunnel engineer",
});

// now let's check that our occupation memory was overwritten
const occupation = await store.get(["user_123", "memories"], "occupation");
console.log(occupation!.value.text);

const memories = await store.search(["user_123", "memories"], {
  query: "What is my occupation?",
  limit: 3,
});

for (const memory of memories) {
  console.log(`Memory: ${memory.value.text} (similarity: ${memory.score})`);
}

export const graph = new StateGraph(StateAnnotation).compile();
