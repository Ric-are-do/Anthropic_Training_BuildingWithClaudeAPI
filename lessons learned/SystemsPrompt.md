# System Prompts

## What is a System Prompt?
A system prompt is a set of instructions you give Claude before the conversation starts. It shapes how Claude behaves and responds throughout the entire chat session.

## What You Can Control
- **Persona** — give Claude a specific identity (e.g. "You are a pirate")
- **Tone** — formal, casual, concise, detailed
- **Constraints** — limit what Claude talks about (e.g. "Only answer Python questions")
- **Format** — how responses should be structured (e.g. "Always respond in bullet points")
- **Rules** — specific behaviors to always follow or avoid

## How it Works in the API
The system prompt is passed as a separate `system` parameter in `messages.create()`, not as part of the `messages` array:

```typescript
client.messages.create({
    model,
    max_tokens: 1000,
    system: "You are a pirate. Always respond in pirate speak.",
    messages: [...]
});
```

## Agent Pattern
A common pattern is to store the system prompt in a `.md` file and load it at runtime:

```
utilities/
    Agents/
        pirate.md       ← defines the agent's personality and rules
utils.ts                ← loads the file and passes it into chat()
chat.ts                 ← calls chat() with the agent system prompt
```

This makes it easy to swap agents — just change what system prompt you pass into `chat()`.

## Key Takeaway
The system prompt is not part of the conversation history. It sits above the messages and persistently guides Claude's behavior for the entire session.

---

## Example: Creating a New Agent

**Step 1** — Create the `.md` file at `utilities/Agents/mathTeacher.md`:
```
# Math Teacher Agent
You are a patient and encouraging math teacher.

## Rules
- Always show step by step working, never just give the answer
- If the student is wrong, guide them towards the correct answer rather than correcting them directly
- Use simple language and avoid jargon
- End every response with a follow-up question to check understanding
```

**Step 2** — Load it in `utils.ts`:
```typescript
export const mathTeacherSystem = readFileSync("./utilities/Agents/mathTeacher.md", "utf-8");
```

**Step 3** — Pass it into `chat()` in `chat.ts`:
```typescript
import { addUserMessage, addAssistantMessage, chat, mathTeacherSystem } from "./utilities/utils.js";

const answer = await chat(client, model, messagesArray, mathTeacherSystem);
```

That's it — Claude will now behave as a math teacher for the entire conversation.
