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
