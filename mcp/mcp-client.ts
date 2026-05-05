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

    // TODO: Read a resource by URI and return its text content
    // hint: use this.client.readResource({ uri })
    // the result has a contents array — each item has a uri and text field
    // parse the text as JSON if the URI is "docs://documents" (the list resource)
    // return the text directly for single-doc resources
    async readResource(uri: string): Promise<unknown> {
        return null;
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