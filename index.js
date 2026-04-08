import Anthropic from "@anthropic-ai/sdk";
import * as dotenv from "dotenv";
import { cwd } from "node:process";
dotenv.config();
console.log("Key loaded:", !!process.env.ANTHROPIC_API_KEY);
const model = "claude-sonnet-4-5";
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
const message1 = await client.messages.create({
    model: model,
    max_tokens: 1000,
    messages: [
        {
            "role": "user",
            "content": "write another sentence "
        }
    ]
});
// checking the message 
const block = message.content[0];
const blockOne = message1.content[0];
if (block.type === "text") {
    console.log("Message received:", block.text);
}
else {
    console.error("Unexpected message format:", message);
}
// checking the message 
if (blockOne.type === "text") {
    console.log("Message received:", blockOne.text);
}
else {
    console.error("Unexpected message format:", message);
}
//# sourceMappingURL=index.js.map