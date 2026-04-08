import Anthropic from "@anthropic-ai/sdk"
import * as dotenv from "dotenv"
import { cwd } from "node:process";
import { addUserMessage, addAssistantMessage, chat } from "./utilities/utils.js";
import { chatloop } from "./chat.js";

dotenv.config();
console.log("Key loaded:", !!process.env.ANTHROPIC_API_KEY);
const model = "claude-sonnet-4-5"
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY || "" });


const messages: Anthropic.MessageParam[] = [];

// how this works 
// add userMessage adds a message to an array called messsages
// chat passes it to the antrhopic api and waits for the response
// addAssistantMessage adds the response from the api to the messages array
// basically each tiime we are passing the messages arrray wto anthropic but each time it will also have the answer that claude gave last 

addUserMessage(messages, "define quantum computing in one sentence");
const answer = await chat(client, model, messages);
addAssistantMessage(messages, answer);
console.log("Answer:", answer);

addUserMessage(messages, "write another sentence");
const answer2 =await  chat(client, model, messages);
addAssistantMessage(messages, answer2);
console.log("Answer:", answer2);

addUserMessage(messages, "give me a fun fact ");
const answer3 =await  chat(client, model, messages);
addAssistantMessage(messages, answer3);
console.log("Answer:", answer3);

// implementing chat loop so we can test it out with the terminal
await chatloop(client, model);


/* 
Manual way before adding utilities functions
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
if(block && block.type === "text")    {
console.log("Message received:", block.text);
    }
 else {
    console.error("Unexpected message format:", message);
}

// checking the message 
const testing = message1.content[0];
if(testing &&testing.type === "text")    {
console.log("Message received:", testing.text);
    }
 else {
    console.error("Unexpected message format:", message);
}

*/
