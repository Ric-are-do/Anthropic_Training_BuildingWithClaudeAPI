import Anthropic from "@anthropic-ai/sdk"
import * as dotenv from "dotenv"
import { cwd } from "node:process";
import { addUserMessage, addAssistantMessage, chat } from "./utilities/utils.js";
import { chatloop } from "./modules/chat.js";
import { streamloop } from "./modules/streaming.js";
import { get_current_DateTime_schema ,getCurrentDateTime } from "./Tools/SetReminder.js";
import { log } from "node:console";
import { chatWithTools, pirateSystem } from "./utilities/toolUtils.js";
import { tools, toolsHandler } from "./Tools/ToolsHandler.js";
import { chatloopwithtools } from "./modules/chatWithTools.js";

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

/*
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

*/
// implementing chat loop so we can test it out with the terminal 
// ++++ This is the method for the CHAT Loop ##
//await chatloop(client, model);

// Implementing streaming chat loop so we can test it out with the terminal
// ++++ This is the method for the streaming Loop ##
//await streamloop(client, model);


/// --------------- implemneting chat with tools ------------//
await chatloopwithtools(
    client,  // the Anthropic client instance used to make API calls
     model, // the model to use e.g. "claude-sonnet-4-5"
      tools, // the schemas from ToolsHandler.ts — tells Claude what tools are available
       toolsHandler // / the function map from ToolsHandler.ts — used by your code to run the actual tool when Claude  requests it
    ); 


