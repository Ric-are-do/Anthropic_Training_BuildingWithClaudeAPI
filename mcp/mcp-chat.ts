import Anthropic from "@anthropic-ai/sdk";
import * as dotenv from "dotenv";
import * as readline from "readline";
import { MCPClient } from "./mcp-client.js";
import type { Tool } from "@modelcontextprotocol/sdk/types.js";
import type { MessageParam, ToolResultBlockParam } from "@anthropic-ai/sdk/resources.js";

dotenv.config();

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY || "" });
const model = "claude-sonnet-4-5";
const messages: MessageParam[] = [];

// --- Tool helpers ---

async function getAllTools(mcpClient: MCPClient): Promise<Anthropic.Tool[]> {
    const tools: Tool[] = await mcpClient.listTools();
    return tools.map((t) => ({
        name: t.name,
        description: t.description ?? "",
        input_schema: t.inputSchema as Anthropic.Tool["input_schema"],
    }));
}

async function executeToolRequests(
    mcpClient: MCPClient,
    response: Anthropic.Message
): Promise<ToolResultBlockParam[]> {
    const toolUseBlocks = response.content.filter((b) => b.type === "tool_use");
    const results: ToolResultBlockParam[] = [];

    for (const block of toolUseBlocks) {
        if (block.type !== "tool_use") continue;
        try {
            const output = await mcpClient.callTool(
                block.name,
                block.input as Record<string, string>
            );
            results.push({
                type: "tool_result",
                tool_use_id: block.id,
                content: JSON.stringify(output),
            });
        } catch (e) {
            results.push({
                type: "tool_result",
                tool_use_id: block.id,
                content: `Error: ${e}`,
                is_error: true,
            });
        }
    }

    return results;
}

// --- Chat loop ---

async function chat(mcpClient: MCPClient, query: string): Promise<string> {
    // Handle /command doc_id — maps to an MCP prompt
    if (query.startsWith("/")) {
        const parts = query.slice(1).split(" ");
        const promptName = parts[0];
        const docId = parts[1];

        const promptResult = await mcpClient.getPrompt(promptName, { doc_id: docId });
        if (promptResult) {
            for (const msg of promptResult.messages) {
                messages.push({
                    role: msg.role,
                    content: typeof msg.content === "string" ? msg.content : (msg.content as { text: string }).text,
                });
            }
        }
    } else {
        // Handle @doc_id mentions — injects doc content as context
        const mentions = query.split(" ").filter((w) => w.startsWith("@")).map((w) => w.slice(1));
        let context = "";

        for (const docId of mentions) {
            const content = await mcpClient.readResource(`docs://documents/${docId}`);
            context += `\n<document id="${docId}">\n${content}\n</document>\n`;
        }

        const prompt = `The user has a question:
<query>
${query}
</query>

The following context may be useful in answering their question:
<context>
${context}
</context>

Note the user's query might contain references to documents like "@report.docx". The "@" is only included as a way of mentioning the doc — the actual name is "report.docx".
If document content is included above, you don't need to use an additional tool to read it.
Answer directly and concisely. Don't refer to the provided context in your answer — just use it.`;

        messages.push({ role: "user", content: prompt });
    }

    const tools = await getAllTools(mcpClient);

    // Agentic loop
    while (true) {
        const response = await client.messages.create({ model, max_tokens: 4096, messages, tools });

        messages.push({ role: "assistant", content: response.content });

        if (response.stop_reason === "tool_use") {
            const toolResults = await executeToolRequests(mcpClient, response);
            messages.push({ role: "user", content: toolResults });
        } else {
            const textBlock = response.content.find((b) => b.type === "text");
            return textBlock && textBlock.type === "text" ? textBlock.text : "";
        }
    }
}

// --- Entry point ---

async function main() {
    const mcpClient = new MCPClient("npx", ["tsx", "mcp/mcp-server.ts"]);
    await mcpClient.connect();

    console.log("MCP Chat ready. Type a message, @doc_id to reference a doc, /command doc_id for prompts, or Ctrl+C to quit.\n");

    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

    const ask = () => {
        rl.question("> ", async (input) => {
            const trimmed = input.trim();
            if (!trimmed) return ask();

            const response = await chat(mcpClient, trimmed);
            console.log(`\n${response}\n`);
            ask();
        });
    };

    ask();

    rl.on("close", async () => {
        await mcpClient.disconnect();
        process.exit(0);
    });
}

main();
