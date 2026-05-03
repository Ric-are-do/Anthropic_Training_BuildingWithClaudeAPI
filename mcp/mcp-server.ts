import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const server = new McpServer({ name: "DocumentMCP", version: "1.0.0" });

const docs: Record<string, string> = {
    "deposition.md": "This deposition covers the testimony of Angela Smith, P.E.",
    "report.pdf": "The report details the state of a 20m condenser tower.",
    "financials.docx": "These financials outline the project's budget and expenditures.",
    "outlook.pdf": "This document presents the projected future performance of the system.",
    "plan.md": "The plan outlines the steps for the project's implementation.",
    "spec.txt": "These specifications define the technical requirements for the equipment.",
};

// TODO: Register a tool to read a doc
// - name: "read_document"
// - takes a doc_id string parameter
// - returns the content of the doc, or an error if not found
// hint: server.tool("name", { param: z.string() }, async ({ param }) => { ... })
// the return shape is: { content: [{ type: "text", text: "..." }] }

// TODO: Register a tool to edit a doc
// - name: "edit_document"
// - takes doc_id and new_content string parameters
// - updates docs[doc_id] and returns a confirmation, or error if not found

// TODO: Register a resource to list all doc IDs
// - URI template: "docs://documents"
// - returns a JSON array of all keys in docs
// hint: server.resource("name", "docs://documents", async (uri) => { ... })

// TODO: Register a resource to return the content of a specific doc
// - URI template: "docs://documents/{doc_id}"
// - returns the content for that doc_id, or error if not found
// hint: server.resource("name", new ResourceTemplate("docs://documents/{doc_id}", ...), async (uri, { doc_id }) => { ... })

// TODO: Register a prompt to summarize a doc
// - name: "summarize"
// - takes a doc_id argument
// - returns a user message asking Claude to summarize the document content
// hint: server.prompt("name", { doc_id: z.string() }, async ({ doc_id }) => { ... })
// the return shape is: { messages: [{ role: "user", content: { type: "text", text: "..." } }] }

// TODO: Register a prompt to rewrite a doc in markdown format
// - name: "rewrite"
// - takes a doc_id argument
// - returns a user message asking Claude to rewrite the document in clean markdown


const transport = new StdioServerTransport();
await server.connect(transport);
