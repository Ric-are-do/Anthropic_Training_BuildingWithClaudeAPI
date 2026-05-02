import { chunkByChar, chunkBySection, chunkBySentences } from "./utilities/Chunking/chunking.js";
import { generateEmbedding } from "./utilities/Chunking/embeddings.js";
import { readFile, writeFile, access } from "fs/promises";

// set this to true when you add a new document and need to regenerate the embeddings
// set it back to false after running once to avoid unnecessary VoyageAI API calls
const FORCE_REEMBED = false;

const embeddingsPath = "Rag_Documents/embeddings.json";

// type that pairs a chunk of text with its embedding vector
type EmbeddedChunk = { text: string, embedding: number[] };

async function loadOrGenerateEmbeddings(sections: string[]): Promise<EmbeddedChunk[]> {

    // access() checks if the file exists — it resolves if yes, rejects if no
    // we catch the rejection and convert it to false so we get a simple boolean
    const embeddingsExist = await access(embeddingsPath).then(() => true).catch(() => false);

    if (embeddingsExist && !FORCE_REEMBED) {
        // embeddings file already exists and we are not forcing a re-embed
        // load from file so we skip all VoyageAI API calls on this run
        console.log("Loading embeddings from file...");
        const raw = await readFile(embeddingsPath, "utf8");
        return JSON.parse(raw) as EmbeddedChunk[];
    }

    // embeddings file doesn't exist or FORCE_REEMBED is true — generate fresh embeddings
    // this calls VoyageAI once per section so it will use API quota
    console.log("Generating embeddings...");
    const embeddedChunks: EmbeddedChunk[] = [];

    for (const section of sections) {
        // "document" inputType tells VoyageAI these are chunks being stored, not a user question
        const embedding = await generateEmbedding(section, "document");
        embeddedChunks.push({ text: section, embedding });
        console.log(`Embedded: "${section.slice(0, 60)}..." (${embedding.length} dimensions)`);
    }

    // save to file so future runs can load instead of re-embedding
    // JSON.stringify with 2-space indent makes the file human-readable if you want to inspect it
    await writeFile(embeddingsPath, JSON.stringify(embeddedChunks, null, 2));
    console.log(`Embeddings saved to ${embeddingsPath}`);

    return embeddedChunks;
}

async function main() {

    // read the source document into a string
    const text = await readFile("Rag_Documents/report.md", "utf8");

    // chunk by section — sections[0] is just the document title so we skip it with .slice(1)
    const sections = chunkBySection(text).slice(1);

    // either load existing embeddings from file or generate new ones depending on FORCE_REEMBED
    const embeddedChunks = await loadOrGenerateEmbeddings(sections);

    console.log(`\nReady — ${embeddedChunks.length} embedded chunks loaded.`);

    // size-based chunking — splits every 150 characters with 20 character overlap
  //  const sizedChunks = chunkByChar(text, 150, 20);
  //  console.log("Size-based chunks:", sizedChunks);

    // structure-based chunking — splits on ## markdown headings
  //  const sectionChunks = chunkBySection(text);
  //  console.log("Section-based chunks:", sectionChunks);

    // sentence-based chunking — groups sentences into chunks of 5, with 1 sentence overlap
  //  const sentenceChunks = chunkBySentences(text, 5, 1);
  //  console.log("Sentence-based chunks:", sentenceChunks);
}

main();
