# Streaming vs Normal API Calls

## The Difference

**Normal (`messages.create`)** — waits for Claude to finish generating the entire response, then returns it all at once. The user sees nothing until it's done.

**Streaming (`messages.stream`)** — returns chunks of text as they're generated. The user sees the response appearing word by word, like ChatGPT.

## When to Use Each

| | `messages.create` | `messages.stream` |
|---|---|---|
| Short responses | Good | Overkill |
| Long responses | User waits | Better UX |
| Need full text before doing something | Yes | Yes (returns full text too) |
| Real-time feel | No | Yes |

## How We Use It In This Project

**Normal chat (`chat` in `utils.ts`):**
```typescript
const message = await client.messages.create({ model, max_tokens: 1024, messages });
return message.content[0].text;
```
Waits for the full response, returns it as a string.

**Streaming (`streamingChat` in `utils.ts`):**
```typescript
const stream = client.messages.stream({ model, max_tokens: 1024, messages });

let fullText = "";
for await (const chunk of stream) {
    if (chunk.type === "content_block_delta" && chunk.delta.type === "text_delta") {
        process.stdout.write(chunk.delta.text); // print each chunk immediately
        fullText += chunk.delta.text;           // build up the full response
    }
}
return fullText;
```
Prints each chunk as it arrives, still returns the full text at the end so it can be added to the messages array.

## Key Detail
`process.stdout.write()` is used instead of `console.log()` because `console.log` adds a newline after each call — which would break the text into separate lines. `stdout.write` just appends the chunk directly.

## chunk.type === "content_block_delta"
The stream sends several event types (start, delta, stop etc). We only care about `content_block_delta` with `text_delta` — that's the actual text content being generated. Everything else is metadata.
