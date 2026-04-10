import Anthropic from "@anthropic-ai/sdk";
import * as dotenv from "dotenv";
import { cwd } from "node:process";
import { addUserMessage, addAssistantMessage, chat, pirateSystem, HoboSystem } from "../utilities/utils.js";
 import * as readline from "readline";



export async function chatloop(client: Anthropic, model: string)
{


let messagesArray: Anthropic.MessageParam[] = [];
    const rl = readline.createInterface({input: process.stdin, output: process.stdout});
    const ask = (question: string): Promise<string> => new Promise((resolve) => rl.question(question, resolve));

while(true) {

    const userInput = await ask("Enter your message (or 'exit' to quit): "); 

    if (userInput === "exit") {
        rl.close();
        break;
    }
    if (userInput != null) {

        addUserMessage(messagesArray, userInput);
        const answer  = await  chat(client, model, messagesArray, HoboSystem);
        addAssistantMessage(messagesArray, answer);
        console.log("Answer:", answer);
    }


}
}