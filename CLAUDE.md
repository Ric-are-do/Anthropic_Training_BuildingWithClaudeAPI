# Claude Code Setup

## Project Overview

This is a TypeScript learning project for the Anthropic API. It covers basic API usage, streaming, tool use, RAG, and MCP. All modules are implemented in TypeScript using the `tsx` runner.

## Running Scripts

- `npm start` — basic chat and tool use (index.ts)
- `npm run rag` — RAG pipeline (rag.ts)
- `npm run mcp` — MCP chat client (mcp/mcp-chat.ts)
- `npx @modelcontextprotocol/inspector npx tsx mcp/mcp-server.ts` — MCP inspector for testing the server

## Environment Variables

All secrets are stored in a `.env` file in the project root. Never commit this file.

```
ANTHROPIC_API_KEY=     ← required for all modules
VOYAGE_API_KEY=        ← required for the RAG module only
```

## TypeScript

This project uses `tsx` to run TypeScript directly — no compilation step needed. Do not use `ts-node` as it has ESM compatibility issues with Node.js v22.

## Key Conventions

- Models: `claude-sonnet-4-5` is used throughout — upgrade to `claude-sonnet-4-6` for the latest
- Tool schemas use Zod (`zod` package) in the MCP module
- MCP documents are in-memory only — changes reset on server restart
- RAG embeddings are cached in `Rag_Documents/embeddings.json`

## Lessons Learned

All module notes are in `lessons learned/` organised by topic:
- `Accessing_Claude_With_API/` — messages, system prompts, streaming
- `Tool_Use_With_Claude/` — tool schemas, tool use loop
- `RAG/` — chunking, embeddings, vector search, full RAG flow
- `MCP/` — MCP architecture, server, client, tools, resources, prompts
