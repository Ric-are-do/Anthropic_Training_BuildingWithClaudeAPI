import Anthropic from "@anthropic-ai/sdk";
import { readFileSync } from "fs";



// This is a generic way of sending a message we will use  
export function addUserMessage( messsages: Anthropic.MessageParam[], text: string ): void {
    messsages.push({
        "role": "user",
        "content": text
    });
}

// Identical to above the only difference is the role is assistant instead of user, this is used to add messages from the assistant
// note that in the his assistant message ,similar to the one we used in utils , we are just changing the text we are passing in
// from 'text' to conent and then the content is the result of a antropic content block that gets returnd 
export function addAssistantToolUseMessage( messsages: Anthropic.MessageParam[], content: Anthropic.ContentBlock[] ): void {
    messsages.push({
        "role": "assistant",
        "content": content   
    });
}

// This next step is how we check and use tools in our methods 
// addToolResultMessage — third step in the tool use loop
  // After Claude requests a tool and you run it, this sends the result back as a user message
  // Claude needs this to know what the tool returned before it can give a final answer
  //
  // messages  — the conversation history array
  // toolID    — must match the id from Claude's tool_use block so Claude can pair the result to its request
  // tool      — the return value of whatever function you ran (getCurrentDateTime, getWeather, etc.)
  //             this function doesn't care which tool was called, it just stores the result
  // we call the method like this :  addToolResultMessage(messages, toolResult, toolID);
export function addToolResultMessage( messsages: Anthropic.MessageParam[] , toolID: string, toolResult: string  ): void {
    messsages.push({
        role: "user",
         content: [
                {
                    type: "tool_result",
                    tool_use_id: toolID,
                    content:  toolResult
        
                }
            ]   
    });
}


// adding our different agent files
export const pirateSystem =  readFileSync("./utilities/Agents/pirate.md", "utf-8");
export const HoboSystem =  readFileSync("./utilities/Agents/angryHobo.md", "utf-8");


// Chat function where we implement tools 
export async function chatWithTools(
    // our parameters for the chat function
    client: Anthropic,
    model: string,
    messages: Anthropic.MessageParam[],
    tools: Anthropic.Tool[], // this is the array of tools that we want to add to this function
    system?: string // takes in the agent md file
)
 :Promise<Anthropic.Message>  // we dont user return type as string here , rather as the full Antropic message so we can see when the stop condition is met 
 {
    const message = await client.messages.create({
        model,
         max_tokens: 1024,
          ...(system !== undefined && { system }), // Means: if system has a value, spread { system } into the object — which adds the system property. If system isundefined, nothing gets added at all.
           messages,
           tools
    });
           

        return message
}