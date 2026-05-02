import { createRequire } from "module";
import * as dotenv from "dotenv";

// VoyageAI's ESM build has a bug referencing a .jsx file that doesn't exist.
// createRequire forces Node.js to load the CJS build instead, which works correctly.
// This is a standard workaround for packages with broken ESM builds in ESM projects.
const require = createRequire(import.meta.url);
const { VoyageAIClient } = require("voyageai");

dotenv.config();

// VoyageAI is a third-party embeddings provider — we use it because Anthropic does not offer an embeddings API.
// The client reads VOYAGE_API_KEY from the .env file automatically.
// Once embeddings are generated they are saved to Rag_Documents/embeddings.json so they only need to be generated once.
// Each entry in that file contains the original chunk text and its embedding vector.
const voyageClient = new VoyageAIClient({ apiKey: process.env.VOYAGE_API_KEY });

// generateEmbedding converts text into a vector — a list of numbers that represent its meaning.
// Accepts either a single string or an array of strings (batch mode).
// Batch mode is more efficient — one API call for all chunks instead of one per chunk.
// inputType tells VoyageAI how the text will be used:
//   "query"    — use this when embedding a user's question
//   "document" — use this when embedding chunks from a document
export async function generateEmbedding(
    text: string,
    inputType: "query" | "document",
    model?: string
): Promise<number[]>;

export async function generateEmbedding(
    text: string[],
    inputType: "query" | "document",
    model?: string
): Promise<number[][]>;

export async function generateEmbedding(
    text: string | string[],
    inputType: "query" | "document" = "query",
    model: string = "voyage-3-large"
): Promise<number[] | number[][]> {

    const result = await voyageClient.embed({
        input: text,   // VoyageAI accepts both a single string and an array of strings
        model,
        inputType
    });

    const data = result.data;
    if (!data || data.length === 0) throw new Error("No embedding returned from VoyageAI");

    // if the input was an array, return all embeddings as a 2D array (one vector per chunk)
    // if the input was a single string, return just the first vector as a flat array
    if (Array.isArray(text)) {
        return data.map((item: { embedding?: number[] }) => {
            if (!item.embedding) throw new Error("Missing embedding in VoyageAI response");
            return item.embedding;
        });
    }

    // the returned vector is a long array of numbers — typically 1024+ values between -1 and +1.
    // two vectors that are close together in this space represent text with similar meaning.
    // this is what allows us to find the most relevant chunks for a given question later on.
    return data[0].embedding!;
}
