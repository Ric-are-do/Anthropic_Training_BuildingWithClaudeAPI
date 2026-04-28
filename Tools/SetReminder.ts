
import { Anthropic } from "@anthropic-ai/sdk";
import { readFileSync } from "fs";


// Get the current datetime in a human-readable format
export function getCurrentDateTime(): string 
{
    const now = new Date();
    const date = now.toLocaleDateString("en-ZA");
    const time = now.toLocaleTimeString("en-ZA");
    return `${date} ${time}`;
}

export const get_current_DateTime_schema : Anthropic.Tool= {
    "name": "get_current_datetime",
    "description": "Get the current date and time in a human-readable format. this is used when you need to get the current date and time to set reminders or for any other reason. the format will be like this: 2023-01-01 12:00:00",
    "input_schema": {
        "type": "object",
        "properties": {}, // this doesnt take in any parameters because we are just getting the current date and time - no need to set values under properties
        "required": [] // this is an empty array because there are no required parameters for this function
    }
}

// Adding the getCurrentDateTime funtion to claude and then getting it to write the jsom schema
// We do prompt it to use the best practices noted in the tool overview documentation to write the schema in the best way possible
// https://platform.claude.com/docs/en/agents-and-tools/tool-use/overview

