import { chunkByChar, chunkBySection, chunkBySentences } from "./utilities/Chunking/chunking.js";
import { generateEmbedding } from "./utilities/Chunking/embeddings.js";
import { VectorIndex } from "./utilities/Chunking/vectorStore.js";
import { readFile, writeFile, access } from "fs/promises";
import * as readline from "readline";

// set this to true when you add a new document and need to regenerate the embeddings
// set it back to false after running once to avoid unnecessary VoyageAI API calls
const FORCE_REEMBED = false;

const embeddingsPath = "Rag_Documents/embeddings.json";

// type that pairs a chunk of text with its embedding vector
type EmbeddedChunk = { text: string, embedding: number[] };

// ── Step 1 & 2: Chunk the document and generate embeddings ───────────────────
// loads from file if embeddings already exist, otherwise calls VoyageAI and saves the result
async function loadOrGenerateEmbeddings(sections: string[]): Promise<EmbeddedChunk[]> {

    // access() checks if the file exists — resolves if yes, rejects if no
    const embeddingsExist = await access(embeddingsPath).then(() => true).catch(() => false);

    if (embeddingsExist && !FORCE_REEMBED) {
        // embeddings file already exists — load from file, no VoyageAI calls needed
        console.log("Loading embeddings from file...");
        const raw = await readFile(embeddingsPath, "utf8");
        return JSON.parse(raw) as EmbeddedChunk[];
    }

    // generate fresh embeddings — sends all chunks in one batch call to VoyageAI
    console.log("Generating embeddings...");
    const embeddings = await generateEmbedding(sections, "document");

    // pair each section with its embedding vector
    // the guard ensures TypeScript knows embedding is definitely a number[] and not undefined
    const embeddedChunks: EmbeddedChunk[] = sections.map((text, i) => {
        const embedding = embeddings[i];
        if (!embedding) throw new Error(`Missing embedding for section ${i}`);
        return { text, embedding };
    });

    // save to file so future runs can skip this step
    await writeFile(embeddingsPath, JSON.stringify(embeddedChunks, null, 2));
    console.log(`Embeddings saved to ${embeddingsPath}`);

    return embeddedChunks;
}

async function main() {

    // ── Step 1: Chunk the source document by section ─────────────────────────
    const text = await readFile("Rag_Documents/report.md", "utf8");
    // sections[0] is just the document title so we skip it with .slice(1)
    const sections = chunkBySection(text).slice(1);

    // ── Step 2: Generate (or load) embeddings for each chunk ─────────────────
    const embeddedChunks = await loadOrGenerateEmbeddings(sections);
    console.log(`\nReady — ${embeddedChunks.length} embedded chunks loaded.`);

    // ── Step 3: Build the vector store and populate it ───────────────────────
    // VectorIndex is our in-memory vector database
    // we store the original text in metadata so we can retrieve it after searching
    const store = new VectorIndex();
    for (const chunk of embeddedChunks) {
        store.addVector(chunk.embedding, { content: chunk.text });
    }

    // ── Steps 4 & 5: Ask questions in a loop ────────────────────────────────
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    const ask = (q: string): Promise<string> => new Promise(resolve => rl.question(q, resolve));

    console.log('\nDocument loaded. Type a question or "exit" to quit.\n');

    while (true) {
        const userQuestion = await ask("Your question: ");

        if (userQuestion.toLowerCase() === "exit") {
            rl.close();
            break;
        }

        // ── Step 4: Embed the user's question ────────────────────────────────
        // "query" inputType tells VoyageAI this is a question, not a document chunk
        const queryEmbedding = await generateEmbedding(userQuestion, "query");

        // ── Step 5: Search for the most relevant chunks ───────────────────────
        // returns the top 2 closest matches as [metadata, cosineDistance] pairs
        // lower distance = more similar to the question
        const results = store.search(queryEmbedding, 2);

        console.log("\nTop results:");
        for (const [metadata, distance] of results) {
            const preview = (metadata.content as string).slice(0, 200);
            console.log(`\nDistance: ${distance.toFixed(4)}\n${preview}...`);
        }
        console.log("");
    }

    // ── Chunking experiments (commented out) ─────────────────────────────────
    // size-based chunking — splits every 150 characters with 20 character overlap
  //  const sizedChunks = chunkByChar(text, 150, 20);
  //  console.log("Size-based chunks:", sizedChunks);

    // sentence-based chunking — groups sentences into chunks of 5, with 1 sentence overlap
  //  const sentenceChunks = chunkBySentences(text, 5, 1);
  //  console.log("Sentence-based chunks:", sentenceChunks);
}

main();
