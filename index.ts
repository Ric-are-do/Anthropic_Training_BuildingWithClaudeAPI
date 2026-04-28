import Anthropic from "@anthropic-ai/sdk"
import * as dotenv from "dotenv"
import { cwd } from "node:process";
import { addUserMessage, addAssistantMessage, chat } from "./utilities/utils.js";
import { chatloop } from "./modules/chat.js";
import { streamloop } from "./modules/streaming.js";
import { get_current_DateTime_schema ,getCurrentDateTime } from "./Tools/SetReminder.js";
import { log } from "node:console";

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
// ++++ This is the method for the CHAT Loop ##
//await chatloop(client, model);

// Implementing streaming chat loop so we can test it out with the terminal
// ++++ This is the method for the streaming Loop ##
//await streamloop(client, model);


/// --------------- work done on 28/04------------//
// Creating and sending off a message using the new Schema tool that we created in the Tools/SetReminder.ts file

messages.push({
    role: "user",
    content: "what is the current date and time ?"
});

// 1. this pusges te nessage , then 
const response = await client.messages.create({
    model: model,
    max_tokens: 1024,
    tools: [get_current_DateTime_schema], // this is the tool we created in the Tools/SetReminder.ts file
    messages: messages
});

const toolUseBlock = response.content.find(block => block.type === "tool_use");
if(!toolUseBlock) throw new Error("No tool use block found in the response");

// now we know tha t claude responded and its stored in the response , next we need to push that response to the assistant message
messages.push({
    role: "assistant",
    content: response.content
});

// When Claude responds with stop_reason: "tool_use" it's essentially saying "I need the current datetime, go get it
 // for me." It has no way to call your TypeScript function itself. So you run getCurrentDateTime() and send the
 // result back as a tool_result message, which is how you tell Claude "here's what that function returned."


messages.push({
    role: "user",
    content: [
        {
            type: "tool_result",
            tool_use_id: toolUseBlock.id,
            content: getCurrentDateTime()       

        }
    ]
});

const finalResponse = await client.messages.create({
    model: model,
    max_tokens: 1024,
    messages: messages
});

console.log("Final Response:", finalResponse.content);





