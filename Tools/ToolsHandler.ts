import { getCurrentDateTime, get_current_DateTime_schema } from "./SetReminder.js";


// why we export tools and ToolHandler
// Tools (Schema) gets passsed into client.message.create so that clude knows the tool exists
// ToolHandlers (the funtions) gets used in the code to actually run the tool when claude requests it 
// One tells claude about the tool , the other is what code gets executed 


export const tools =[get_current_DateTime_schema]

// this is a list of tools and their names , everytime we add a new tool, we add it here so that 
// we can easily call it in our chatWithTools function and also in the tool handlers that we will create below
export const toolsHandler = {
    "get_current_datetime": getCurrentDateTime
    // note this strung needs to match exactly what claude is calling in the tool use block of the response that it gives us when we call the chatWithTools function
    // note that it needs to be the tool name you pass in the tools array of the chatWithTools function and not the name of the function in your code - this is because claude is going to be looking for the tool name that you passed in the tools array and not the name of the function in your code
}
