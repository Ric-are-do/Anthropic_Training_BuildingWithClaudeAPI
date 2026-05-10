# Messages Create

## The Manual Way
Before we added utility functions, every API call had to be written out in full. This meant repeating the same boilerplate every time you wanted to send a message:

```typescript
const client = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY || "",
});

const message = await client.messages.create({
    model: model,
    max_tokens: 1000,
    messages: [
        {
            "role": "user",
            "content": "define quantum computing in one sentence"
        }
    ]
});

// Then you had to manually extract the text and handle the type check every time
const block = message.content[0];
if(block && block.type === "text") {
    console.log("Message received:", block.text);
} else {
    console.error("Unexpected message format:", message);
}
```

If you wanted a second message, you had to repeat all of that again. No conversation history was being maintained either — each call was completely isolated.

---

## The Better Way — Using Utility Functions
Once we added the utility functions in `utilities/utils.ts`, all of that boilerplate was replaced with three simple functions:

```typescript
// adds a user message to the messages array
addUserMessage(messages, "define quantum computing in one sentence");

// sends the messages array to Anthropic and returns the response text
const answer = await chat(client, model, messages);

// adds Claude's response to the messages array so the next call has full context
addAssistantMessage(messages, answer);
```

### What each function does

**`addUserMessage(messages, text)`**
Pushes a `{ role: "user", content: text }` object onto the messages array. Nothing is sent to the API yet.

**`addAssistantMessage(messages, text)`**
Pushes a `{ role: "assistant", content: text }` object onto the messages array. Used to store Claude's response so it becomes part of the conversation history.

**`chat(client, model, messages, system?)`**
Sends the entire messages array to the Anthropic API using `client.messages.create()`, handles the type checking internally, and returns just the response text as a string.

### The result
Instead of repeating boilerplate for every message, a full multi-turn conversation looks like this:

```typescript
const messages: Anthropic.MessageParam[] = [];

addUserMessage(messages, "define quantum computing in one sentence");
const answer = await chat(client, model, messages);
addAssistantMessage(messages, answer);

addUserMessage(messages, "write another sentence");
const answer2 = await chat(client, model, messages);
addAssistantMessage(messages, answer2);
```

Clean, readable, and Claude has full conversation context on every call.
