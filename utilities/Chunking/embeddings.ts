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

// generateEmbedding converts a piece of text into a vector — a list of numbers that represent its meaning.
// We use this to embed chunks during preprocessing and to embed user questions at query time.
// inputType tells VoyageAI how the text will be used:
//   "query"    — use this when embedding a user's question
//   "document" — use this when embedding chunks from a document
export async function generateEmbedding(
    text: string,
    inputType: "query" | "document" = "query", // defaults to query since thats the most common use at runtime
    model: string = "voyage-3-large"
): Promise<number[]> {

    const result = await voyageClient.embed({
        input: text,       // the text to embed
        model,             // which VoyageAI model to use
        inputType          // tells the model whether this is a question or a document chunk
    });

    // result.data is an array of embedding objects — one per input text
    // since we always pass a single string, we take the first item and return its embedding vector
    const embedding = result.data?.[0]?.embedding;

    if (!embedding) throw new Error("No embedding returned from VoyageAI");

    // the returned vector is a long array of numbers — typically 1024+ values between -1 and +1.
    // two vectors that are close together in this space represent text with similar meaning.
    // this is what allows us to find the most relevant chunks for a given question later on.
    return embedding;
}
