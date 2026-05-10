# Tools and Schemas with Claude

## What is a Tool?
A tool is a function you define that Claude can request to call. Claude doesn't execute the function itself — it tells you it wants to use it, you run it, and send the result back.

Each tool has two parts:
1. **The schema** — tells Claude what the tool is and what parameters it takes
2. **The implementation** — the actual TypeScript function that runs

**Important distinction:**
Claude only ever sees the schema — the name, description, and input parameters. It has no idea your actual TypeScript function exists. When Claude decides to use a tool it just says "I want to call `get_current_datetime`" — your code is what runs the function and sends the result back. Claude never touches the implementation.

- **Schema** → what Claude sees
- **Function** → what your code runs
- **`tool_result`** → how you bridge the two

---

## Anatomy of a Schema

```typescript
import Anthropic from "@anthropic-ai/sdk";

const my_tool_schema: Anthropic.Tool = {
    name: "tool_name",               // Claude uses this to refer to the tool
    description: "What it does.",    // Claude reads this to decide when to use it
    input_schema: {
        type: "object",              // always "object"
        properties: {                // parameters the tool accepts
            param_name: {
                type: "string",
                description: "What this parameter is for"
            }
        },
        required: ["param_name"]     // which parameters Claude must always provide
    }
}
```

**Key fields:**
- `name` — lowercase with underscores
- `description` — the most important field, be specific so Claude knows when to use it
- `input_schema` — Anthropic's format (not `parameters` like OpenAI)
- `Anthropic.Tool` — the TypeScript type from the SDK that gives you type safety

---

## Example 1: No Parameters — getCurrentDateTime

A tool that takes no parameters has empty `properties` and `required`:

```typescript
import Anthropic from "@anthropic-ai/sdk";

// Implementation
function getCurrentDateTime(): string {
    const now = new Date();
    const date = now.toLocaleDateString("en-ZA");
    const time = now.toLocaleTimeString("en-ZA");
    return `${date} ${time}`;
}

// Schema
const get_current_datetime_schema: Anthropic.Tool = {
    name: "get_current_datetime",
    description: "Get the current date and time in a human-readable format.",
    input_schema: {
        type: "object",
        properties: {},
        required: []
    }
}
```

---

## Example 2: With Parameters — getWeather

A tool that requires a location parameter:

```typescript
import Anthropic from "@anthropic-ai/sdk";

// Implementation
function getWeather(location: string): string {
    // In a real app this would call a weather API
    return `The weather in ${location} is sunny and 22°C.`;
}

// Schema
const get_weather_schema: Anthropic.Tool = {
    name: "get_weather",
    description: "Get the current weather for a given location.",
    input_schema: {
        type: "object",
        properties: {
            location: {
                type: "string",
                description: "The city and country e.g. 'London, UK'"
            }
        },
        required: ["location"]
    }
}
```

---

## Key Difference from Python
The Anthropic Python SDK uses `ToolParam`, TypeScript uses `Anthropic.Tool` — same concept, just the TypeScript equivalent. Both enforce the correct structure.

## Folder Structure
```
tools/
    getCurrentDateTime.ts   ← schema + implementation in the same file
    getWeather.ts
    index.ts                ← exports all tools
```

---

## Sending a Tool to Claude and Handling the Response

### Best Practices
- Add `strict: true` to your tool definition to guarantee Claude's calls always match your schema
- Use `satisfies Anthropic.Tool` instead of `: Anthropic.Tool` if you add extra fields like `strict` that aren't in the SDK type yet
- The `description` field is the most important — Claude decides **when** to call the tool based on it. Include the return format so Claude knows how to interpret the result

### Passing Tools to Claude
Tools are passed alongside `messages` in `client.messages.create`. Passing a tool does **not** force Claude to use it — Claude decides based on the user message and the tool description. Use `tool_choice` if you want to force a specific tool.

```typescript
const response = await client.messages.create({
    model: model,
    max_tokens: 1024,
    tools: [get_current_datetime_schema],
    messages: messages
});
```

### What Claude Returns When It Calls a Tool
When Claude decides to use a tool, `stop_reason` is `"tool_use"` and `response.content` contains a `tool_use` block:

```json
{
  "type": "tool_use",
  "id": "toolu_01DHuo8E5FNMumZtMSGiisKB",
  "name": "get_current_datetime",
  "input": {}
}
```

Extract it like this:
```typescript
const toolUseBlock = response.content.find(block => block.type === "tool_use");
if (!toolUseBlock) throw new Error("No tool use block found in the response");
```

The `if` guard is needed because `find()` can return `undefined` — TypeScript requires you to handle that case.

### The Full Tool Use Loop
Tool use requires more pushes than a normal conversation because each turn must be recorded so Claude has full context on every call:

```typescript
// 1. User asks
messages.push({ role: "user", content: "what is the current date and time?" });

// 2. Send to Claude with tools
const response = await client.messages.create({ model, max_tokens: 1024, tools: [get_current_datetime_schema], messages });

// 3. Find the tool_use block
const toolUseBlock = response.content.find(block => block.type === "tool_use");
if (!toolUseBlock) throw new Error("No tool use block found in the response");

// 4. Push Claude's tool_use response as the assistant turn
messages.push({ role: "assistant", content: response.content });

// 5. Run your function and push the result back as a tool_result
messages.push({
    role: "user",
    content: [{
        type: "tool_result",
        tool_use_id: toolUseBlock.id,   // must match the id from the tool_use block
        content: getCurrentDateTime()    // your actual function call
    }]
});

// 6. Send again — Claude reads the result and gives the final answer
const finalResponse = await client.messages.create({ model, max_tokens: 1024, tools: [get_current_datetime_schema], messages });
console.log("Final response:", finalResponse.content);
```

Normal conversation: push → send → push
Tool use: push → send → push → push → send

### Common Errors
- `"tool_call"` is OpenAI's name — Anthropic uses `"tool_use"`
- `.js` extension required on imports when `"type": "module"` is set in `package.json`
- `return` only works inside a function — use `throw new Error(...)` at the top level

---

## Full Tool Use Flow

The tool and its schema live in `Tools/SetReminder.ts` and are imported into `index.ts` where the flow runs. The schema tells Claude what the tool does, the function is what your code actually executes.

```
┌─────────────────────────────────────────────────────┐
│                    YOUR CODE                        │
└─────────────────────────────────────────────────────┘

1. Push user message
   messages = [{ role: "user", content: "what is the time?" }]
                          │
                          ▼
2. Send to Anthropic
   client.messages.create({ model, max_tokens, tools, messages })
                          │
                          ▼
3. Claude responds
   stop_reason: "tool_use"
   content: [{ type: "tool_use", id: "toolu_123", name: "get_current_datetime", input: {} }]
                          │
                          ▼
4. Check tool was used
   toolUseBlock = response.content.find(block => block.type === "tool_use")
   if (!toolUseBlock) throw error
                          │
                          ▼
5. Push Claude's response as assistant turn
   messages = [
     { role: "user",      content: "what is the time?" },
     { role: "assistant", content: response.content }
   ]
                          │
                          ▼
6. YOU run the function, push result as user turn
   messages = [
     { role: "user",      content: "what is the time?" },
     { role: "assistant", content: response.content },
     { role: "user",      content: [{ type: "tool_result", tool_use_id: "toolu_123", content: "29/04/2026 10:30:00" }] }
   ]
                          │
                          ▼
7. Send full history back to Anthropic
   client.messages.create({ model, max_tokens, tools, messages })
                          │
                          ▼
8. Claude reads result, responds with text
   content: [{ type: "text", text: "The current date and time is April 29, 2026 at 10:30 AM" }]
                          │
                          ▼
9. Extract and print
   finalResponse.content.find(block => block.type === "text").text
```

### Code for each step

**Step 1 — Push user message**
```typescript
messages.push({ role: "user", content: "what is the current date and time?" });
```

**Step 2 — Send to Anthropic with tools**
```typescript
const response = await client.messages.create({
    model: model,
    max_tokens: 1024,
    tools: [get_current_DateTime_schema],
    messages: messages
});
```

**Steps 3 & 4 — Check Claude used the tool**
```typescript
// Claude returns stop_reason: "tool_use" and a tool_use block in content
const toolUseBlock = response.content.find(block => block.type === "tool_use");
if (!toolUseBlock) throw new Error("No tool use block found in the response");
```

**Step 5 — Push Claude's response as the assistant turn**
```typescript
messages.push({ role: "assistant", content: response.content });
```

**Step 6 — Run the function and push the result as a user turn**
```typescript
// You execute getCurrentDateTime() here — Claude never runs it itself
messages.push({
    role: "user",
    content: [{
        type: "tool_result",
        tool_use_id: toolUseBlock.id,   // matches the id Claude sent back
        content: getCurrentDateTime()    // the actual return value of your function
    }]
});
```

**Steps 7 & 8 — Send full history back, get final answer**
```typescript
const finalResponse = await client.messages.create({
    model: model,
    max_tokens: 1024,
    tools: [get_current_DateTime_schema],
    messages: messages
});
```

**Step 9 — Extract and print the text**
```typescript
// content is a union type — narrow to TextBlock before accessing .text
const textBlock = finalResponse.content.find(block => block.type === "text");
if (textBlock && textBlock.type === "text") {
    console.log(textBlock.text);
}
```

---

## Building a Reusable Tool Chat Loop

Rather than writing the full tool use loop every time, we refactored it into a set of reusable pieces across four files. Here is what each layer does and how they connect.

---

### 1. What it does

`chatloopwithtools` is an interactive terminal chat loop that supports tool use. The user types a message, Claude decides whether to use a tool or respond normally, and the loop handles both cases automatically. You can keep chatting and the full conversation history is maintained throughout.

---

### 2. Tools/ToolsHandler.ts — the central tool registry

This is the single place you update when adding new tools. It exports two things:

- `tools` — the array of schemas passed to Anthropic so Claude knows what tools exist
- `toolsHandler` — a map of tool names to their implementations, used by your code to run the right function when Claude requests it

```typescript
import { getCurrentDateTime, get_current_DateTime_schema } from "./SetReminder.js";

export const tools = [get_current_DateTime_schema];

export const toolsHandler = {
    "get_current_datetime": getCurrentDateTime
    // key must match exactly the tool name in the schema — Claude uses this name in its response
}
```

To add a new tool later: define it in its own file, import it here, add the schema to `tools` and the function to `toolsHandler`. Every chat that uses this registry gets the new tool automatically.

---

### 3. utilities/toolUtils.ts — the helper functions

Three helper functions that handle the message pushing so the loop stays clean:

```typescript
// Pushes a plain user message
addUserMessage(messages, text);

// Pushes Claude's tool_use response as the assistant turn
addAssistantToolUseMessage(messages, response.content);

// Pushes your function's result back as a user turn (tool_result block)
addToolResultMessage(messages, toolUseBlock.id, toolResult);
```

And the core API call wrapper:

```typescript
// Sends messages to Anthropic with tools, returns the full response object
// Returns Anthropic.Message (not a string) so the caller can check stop_reason
export async function chatWithTools(client, model, messages, tools, system?): Promise<Anthropic.Message>
```

---

### 4. modules/chatWithTools.ts — the chat loop

This is where the full tool use loop lives. It takes the client, model, tools array, and toolHandlers map as parameters — keeping it flexible so different tool sets can be passed in.

```typescript
export async function chatloopwithtools(
    client: Anthropic,
    model: string,
    tools: Anthropic.Tool[],
    toolHandlers: Record<string, () => string>  // Dictionary<string, Func<string>> in C# terms
)
```

Inside the loop:
1. Read user input from terminal
2. Push it to messages with `addUserMessage`
3. Send to Claude with `chatWithTools`
4. Check `stop_reason`:
   - **`"tool_use"`** → find the tool_use block, look up the function in `toolHandlers` by name, run it, push both messages, send to Claude again for the final answer
   - **anything else** → push Claude's response and print the text block

```typescript
if (answer.stop_reason === "tool_use") {
    const toolUseBlock = answer.content.find(block => block.type === "tool_use");
    if (!toolUseBlock || toolUseBlock.type !== "tool_use") throw new Error("No tool use block found");

    const toolFunction = toolHandlers[toolUseBlock.name];  // look up by name Claude returned
    if (!toolFunction) throw new Error(`No handler found for tool: ${toolUseBlock.name}`);

    const toolResult = toolFunction();  // you run the function, not Claude

    addAssistantToolUseMessage(messagesArray, answer.content);
    addToolResultMessage(messagesArray, toolUseBlock.id, toolResult);

    const finalResponse = await chatWithTools(client, model, messagesArray, tools, pirateSystem);
    const textBlock = finalResponse.content.find(block => block.type === "text");
    if (textBlock && textBlock.type === "text") console.log("Answer:", textBlock.text);
} else {
    addAssistantToolUseMessage(messagesArray, answer.content);
    const textBlock = answer.content.find(block => block.type === "text");
    if (textBlock && textBlock.type === "text") console.log("Answer:", textBlock.text);
}
```

---

### 5. index.ts — wiring it all together

```typescript
import { chatloopwithtools } from "./modules/chatWithTools.js";
import { tools, toolsHandler } from "./Tools/ToolsHandler.js";

await chatloopwithtools(
    client,       // the Anthropic client instance
    model,        // the model to use e.g. "claude-sonnet-4-5"
    tools,        // schemas from ToolsHandler.ts — tells Claude what tools are available
    toolsHandler  // function map from ToolsHandler.ts — runs the actual tool when Claude requests it
);
```

`index.ts` does not need to know anything about individual tools — it just imports the registry and passes it in. Add new tools to `ToolsHandler.ts` and `index.ts` never needs to change.
