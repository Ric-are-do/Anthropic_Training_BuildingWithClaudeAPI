import { chunkByChar, chunkBySection, chunkBySentences } from "./utilities/Chunking/chunking.js";
import { readFile } from "fs/promises";

async function main() {
    // Read the content of the file into a string
    const filePath = "Rag_Documents/report.md" // Update this to your actual file path
    const text = await readFile(filePath, "utf8");

    // size-based chunking — splits every 150 characters with 20 character overlap
  //  const sizedChunks = chunkByChar(text, 150, 20);
  //  console.log("Size-based chunks:", sizedChunks);

    // structure-based chunking — splits on ## markdown headings
  //  const sectionChunks = chunkBySection(text);
  //  console.log("Section-based chunks:", sectionChunks);

    // sentence-based chunking — groups sentences into chunks of 5, with 1 sentence overlap
    const sentenceChunks = chunkBySentences(text, 5, 1);
    console.log("Sentence-based chunks:", sentenceChunks);


    
};

main();