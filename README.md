# Agent Chat UI

Agent Chat UI is a Vite + React application which enables chatting with any LangGraph server with a `messages` key through a chat interface.

## Setup

```

Install dependencies:

```bash
npm install
```

Run the app:

```bash
npm run dev
```

The app will be available at `http://localhost:3000`.

## Usage

Once the app is running (or if using the deployed site), you'll be prompted to enter:

- **Deployment URL**: The URL of the LangGraph server you want to chat with. This can be a production or development URL.
- **Assistant/Graph ID**: The name of the graph, or ID of the assistant to use when fetching, and submitting runs via the chat interface.
- **LangSmith API Key**: (only required for connecting to deployed LangGraph servers) Your LangSmith API key to use when authenticating requests sent to LangGraph servers.

After entering these values, click `Continue`. You'll then be redirected to a chat interface where you can start chatting with your LangGraph server.

Once the environment is executed, **LangStudio** will automatically open in your browser. Through LangStudio, you can visualize and inspect the structure of your graphs, including nodes, edges, and the complete workflow of your agents.


