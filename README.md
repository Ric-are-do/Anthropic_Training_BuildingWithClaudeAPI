# Anthropic Training

A hands-on TypeScript project for learning the Anthropic API by working through the official Anthropic SkillJar course. All examples from the course are implemented in TypeScript rather than Python.

## Purpose

This project covers the following modules from the course:

- **Basic API usage** — sending messages, multi-turn conversations, system prompts
- **Streaming** — streaming vs standard responses
- **Tool use** — defining tools, handling tool calls, agentic loops
- **RAG (Retrieval-Augmented Generation)** — chunking, embeddings via VoyageAI, vector search
- **MCP (Model Context Protocol)** — building an MCP server and client, tools, resources, and prompts

Each module is documented in `lessons learned/` with notes, explanations, and code examples written as the concepts were learned.

---

## Prerequisites

- Node.js v18+
- An Anthropic API key
- A VoyageAI API key (required for the RAG module only)

---

## Setup

### 1. Clone the repo

```bash
git clone <repo-url>
cd AnthropicTraining
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env` file in the project root:

```
ANTHROPIC_API_KEY=your_anthropic_api_key_here
VOYAGE_API_KEY=your_voyageai_api_key_here
```

Never commit the `.env` file — it is already listed in `.gitignore`.

---

## Dependencies

| Package | Purpose |
|---|---|
| `@anthropic-ai/sdk` | Anthropic API client |
| `@modelcontextprotocol/sdk` | MCP server and client |
| `voyageai` | Embedding generation for RAG |
| `zod` | Schema validation for MCP tool definitions |
| `dotenv` | Loads environment variables from `.env` |
| `tsx` | Runs TypeScript files directly without compiling |
| `typescript` | TypeScript compiler |

---

## Project Structure

```
index.ts                  ← main entry point (basic API, tool use)
rag.ts                    ← RAG pipeline entry point

modules/
  chat.ts                 ← basic conversation loop
  streaming.ts            ← streaming conversation loop
  chatWithTools.ts        ← tool use conversation loop

utilities/
  utils.ts                ← general helper functions
  toolUtils.ts            ← tool use helper functions
  Chunking/
    chunking.ts           ← splits documents into sections
    embeddings.ts         ← generates embeddings via VoyageAI
    vectorStore.ts        ← in-memory vector store with cosine similarity search
  Agents/
    pirate.md             ← pirate system prompt agent
    angryHobo.md          ← angry hobo system prompt agent

Tools/
  SetReminder.ts          ← getCurrentDateTime tool and schema
  ToolsHandler.ts         ← tool registry and handler map

mcp/
  mcp-server.ts           ← MCP server (tools, resources, prompts)
  mcp-client.ts           ← MCP client class
  mcp-chat.ts             ← MCP chat entry point

Rag_Documents/
  report.md               ← source document for RAG
  embeddings.json         ← cached embeddings (auto-generated)

lessons learned/          ← markdown notes per module
  Accessing_Claude_With_API/
  Tool_Use_With_Claude/
  RAG/
  MCP/
```

---

## Running the Project

### Basic chat and tool use
```bash
npm start
```

### RAG pipeline
```bash
npm run rag
```

### MCP chat
```bash
npm run mcp
```

### Test MCP server with the inspector
```bash
npx @modelcontextprotocol/inspector npx tsx mcp/mcp-server.ts
```

---

## Claude Code Integration

This project includes a `CLAUDE.md` file in the root directory. If you use [Claude Code](https://claude.ai/code) as your AI coding assistant, it will automatically pick up this file when you open the project, giving Claude context about the project structure, scripts, and conventions.

To get started with Claude Code in this project:

```bash
claude
```

Claude Code reads `CLAUDE.md` automatically — no extra setup needed. You can also run `/init` inside Claude Code to have it generate additional project context if needed.

---

## Notes

- The project uses `tsx` as the TypeScript runner instead of `ts-node` due to ESM compatibility issues with Node.js v22
- Documents in the MCP server are stored in memory — changes made during a session are lost when the server restarts
- The RAG embeddings are cached in `Rag_Documents/embeddings.json` — set `FORCE_REEMBED = true` in `rag.ts` to regenerate them
