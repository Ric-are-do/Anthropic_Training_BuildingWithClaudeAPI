import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import type { Tool, Prompt, GetPromptResult } from "@modelcontextprotocol/sdk/types.js";

export class MCPClient {
    private client: Client;
    private transport: StdioClientTransport;

    constructor(command: string, args: string[]) {
        this.transport = new StdioClientTransport({ command, args });
        this.client = new Client({ name: "mcp-chat-client", version: "1.0.0" });
    }

    async connect(): Promise<void> {
        await this.client.connect(this.transport);
    }

    async disconnect(): Promise<void> {
        await this.transport.close();
    }

    // TODO: Return a list of tools defined by the MCP server
    // hint: use this.client.listTools() — returns { tools: Tool[] }
    // return just the tools array
    async listTools(): Promise<Tool[]> {

        const result = await this.client.listTools();
        return result.tools;

    }

    // TODO: Call a tool by name with the given input and return the result
    // hint: use this.client.callTool({ name, arguments: input })
    // return the result directly
    async callTool(name: string, input: Record<string, string>): Promise<unknown> {

        const result = await this.client.callTool({ name, arguments: input });
        return result;
    }

    // TODO: Return a list of prompts defined by the MCP server
    // hint: use this.client.listPrompts() — returns { prompts: Prompt[] }
    // return just the prompts array
    async listPrompts(): Promise<Prompt[]> {
        return [];
    }

    // TODO: Get a specific prompt by name with the given arguments
    // hint: use this.client.getPrompt({ name, arguments: args })
    // return the result directly (it contains a messages array)
    async getPrompt(name: string, args: Record<string, string>): Promise<GetPromptResult | null> {
        return null;
    }

    async readResource(uri: string): Promise<unknown> {
        // 1. Send the URI to the MCP server over the active session
        //    The server matches the URI to the right registered resource handler and runs it
        //    e.g. "docs://documents"             → list_documents handler (returns JSON array)
        //         "docs://documents/report.pdf"  → fetch_document handler (returns plain text)
        const result = await this.client.readResource({ uri });

        // 2. The server returns a contents array — grab the first item
        //    Each item is either: { uri, text, mimeType? }  ← text resource
        //                     or: { uri, blob, mimeType? }  ← blob resource (binary data)
        const firstContent = result.contents[0];

        // 3. Guard — if the server returned an empty contents array, return null
        if (!firstContent) return null;

        // 4. Guard — narrow the TypeScript type to text resource (not blob)
        //    TypeScript sees contents as (text | blob)[] so we must confirm "text" exists
        //    before accessing it, otherwise the compiler will complain
        if (!("text" in firstContent)) return null;

        // 5. Use the mimeType to decide how to parse the response — this is better than
        //    checking the URI directly because it works for ANY JSON resource, not just
        //    "docs://documents". If we add more JSON resources later, this handles them too.
        if (firstContent.mimeType === "application/json") {
            // The server returned a JSON string e.g. '["deposition.md","report.pdf"]'
            // Parse it back into an actual JavaScript array/object before returning
            return JSON.parse(firstContent.text as string);
        }

        // 6. Plain text resource (mimeType: "text/plain") — return the string directly
        //    No parsing needed — it's already the document content as a plain string
        return firstContent.text;
    }


   
}

// testing the tools 
// Test by running : npx tsx mcp/mcp-client.ts
async function main() {
      const client = new MCPClient("npx", ["tsx", "mcp/mcp-server.ts"]);
      await client.connect();

      const tools = await client.listTools();
      console.log("Available tools:", tools.map(t => t.name));

      await client.disconnect();
}

main();