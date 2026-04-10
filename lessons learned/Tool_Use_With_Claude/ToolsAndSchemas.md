# Tools and Schemas with Claude

## What is a Tool?
A tool is a function you define that Claude can request to call. Claude doesn't execute the function itself — it tells you it wants to use it, you run it, and send the result back.

Each tool has two parts:
1. **The schema** — tells Claude what the tool is and what parameters it takes
2. **The implementation** — the actual TypeScript function that runs

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
