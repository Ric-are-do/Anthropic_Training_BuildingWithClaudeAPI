import Anthropic from "@anthropic-ai/sdk";
import { readFileSync } from "node:fs";



// messages : anthropic.messageParam[] - this is an array of messages , typed with the SDKs build in type
// text: string - the message text 
// : voiud means that the function returns nothing, it just modifies the messages array by adding a new message to it


export function addUserMessage( messsages: Anthropic.MessageParam[], text: string ): void {
    messsages.push({
        "role": "user",
        "content": text
    });
}

// Identical to above the only difference is the role is assistant instead of user, this is used to add messages from the assistant to the messages array
export function addAssistantMessage( messsages: Anthropic.MessageParam[], text: string ): void {
    messsages.push({
        "role": "assistant",
        "content": text
    });
}

// chat 
// asunc because the API call is asynchronous and we need to wait for the response before we can continue with the rest of the code
// promise<string> is the return type ( asumc function must always return a promise ) the promise will resolve to a string which is the response from the API
// ?"" fallback handles the case where content isnt text , (typescript is a bit strict and wants to make sure we handle all possible cases) if content is not text we return an empty string instead of throwing an error

export const pirateSystem =  readFileSync("./utilities/Agents/pirate.md", "utf-8");
export const HoboSystem =  readFileSync("./utilities/Agents/angryHobo.md", "utf-8");

export async function chat(
    // our parameters for the chat function
    client: Anthropic,
    model: string,
    messages: Anthropic.MessageParam[],
    system?: string // takes in the agent md file 
)
 :Promise<string>
 {
    const message = await client.messages.create({
        model,
         max_tokens: 1024,
          ...(system !== undefined && { system }), // Means: if system has a value, spread { system } into the object — which adds the system property. If system isundefined, nothing gets added at all.
           messages});
    const block = message.content[0];
        return block && block.type === "text" ? block.text : "";
}
    
// creating a streaming version of sending messahes 
export async function streamingChat(
    // our parameters for the chat function
    client: Anthropic,
    model: string,
    messages: Anthropic.MessageParam[],
    system?: string, // takes in the agent md file  
)
 :Promise<string>
 {
    const stream = client.messages.stream({
        model,
         max_tokens: 1024,
          ...(system !== undefined && { system }), // Means: if system has a value, spread { system } into the object — which adds the system property. If system isundefined, nothing gets added at all.
           messages});

           let fullText = ""; 

           for await (const chunk of stream)
           {
            if( chunk.type === "content_block_delta" && chunk.delta.type === "text_delta")
            {
                process.stdout.write(chunk.delta.text);
                fullText += chunk.delta.text;
            }
           }

    console.log(); // new line 
    return fullText;
}

