import Anthropic from "@anthropic-ai/sdk";
import { addAssistantToolUseMessage, addToolResultMessage , chatWithTools, pirateSystem} from "../utilities/toolUtils.js";
import * as readline from "readline";
import { addUserMessage } from "../utilities/utils.js";




export async function chatloopwithtools
(client: Anthropic,
 model: string,
 tools: Anthropic.Tool[],
 toolHandlers: Record<string, () => string>
 )
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
        const answer  = await  chatWithTools(client, model, messagesArray,tools, pirateSystem); 

        // inserting a stop reason here to check if the stop reason is tool_use and then if it is we will run the tool and then send the result back to claude using the addToolResultMessage method
        if(answer.stop_reason === "tool_use")
        {
           //1. find the tool use block form the response 
           const toolUseBlock = answer.content.find(block => block.type === "tool_use");
              if(!toolUseBlock || toolUseBlock.type !== "tool_use") throw new Error("No tool use block found in the response");

            //2. Look up the functions in the toolHandlers using the tool name Claude request
            const toolFunction = toolHandlers[toolUseBlock.name];
            if(!toolFunction) throw new Error(`No tool handler found for tool ${toolUseBlock.name}`);

            //3. Run the function and then store the result
            const toolResult = toolFunction();

            //4. Push claudes response and the tool result to messages 
            addAssistantToolUseMessage(messagesArray, answer.content); // this is claudes response to the user message where it also says that it wants to use a tool
            addToolResultMessage(messagesArray, toolUseBlock.id, toolResult); // this is the message where we send the result of the tool back to claude so that it can use it in its next response

            //5. Send to claude again and wait for the final response after the tool result has been sent
            const finalResponse = await chatWithTools(client, model, messagesArray, tools, pirateSystem);
            const textBlock = finalResponse.content.find(block => block.type === "text");
            if(textBlock && textBlock.type === "text")
            {
                console.log("Answer:", textBlock.text);
            }

            /*
            . Get response → check tool name
  2. Look up function in handlers by name
  3. Run the function
  4. Push assistant turn + tool result to messages
  5. Send again → get final text answer
  */

        }
        else {
            addAssistantToolUseMessage(messagesArray, answer.content);  //1. Respond with a normal answer from claude
            const textBlock = answer.content.find(block => block.type === "text"); //2. Check if the content of that answer has a text block ( which means its a normal response and not a tool use response) and if it does we just log it to the console
            if(textBlock && textBlock.type === "text") // 3. if there is a text block we log it to the console
            {
                console.log("Answer:", textBlock.text);
            }
        }
        
    }


}
}