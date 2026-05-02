// chunkByChar splits a string into overlapping chunks of a fixed character size.
// This is size-based chunking — the simplest RAG chunking strategy.
export function chunkByChar(
    text: string,
    chunkSize: number = 150,   // how many characters each chunk contains
    chunkOverlap: number = 20  // how many characters the next chunk steps back to share context
): string[] {

    const chunks: string[] = []; // this is the result array — each item will be one chunk of the original string
    let startIdx = 0;            // cursor that tracks where we are in the string

    while (startIdx < text.length) {

        // endIdx is where this chunk stops — either chunkSize characters ahead, or the end of the string
        // Math.min prevents us from reading past the end of the string
        const endIdx = Math.min(startIdx + chunkSize, text.length);

        // slice cuts the string from startIdx up to (but not including) endIdx
        // this is our chunk — a substring of the original text
        const chunk = text.slice(startIdx, endIdx);
        chunks.push(chunk); // add the chunk to our result array

        // move the cursor forward for the next iteration
        // if we haven't reached the end: step forward by chunkSize but step back by chunkOverlap
        // this means the next chunk starts slightly before where this one ended — giving shared context
        // if we have reached the end: jump to text.length to exit the while loop cleanly
        startIdx = endIdx < text.length ? endIdx - chunkOverlap : text.length;
    }

    return chunks; // hand back the completed array of string chunks
}



// used when we want to chunk by sections
export function chunkBySection(documentText: string): string[] {
    return documentText.split(/\n## /);
}



// chunkBySentences splits text into individual sentences, then groups them into chunks of sentencesPerChunk size.
// overlap controls how many sentences are shared between consecutive chunks — same concept as chunkByChar's overlap.
export function chunkBySentences(
    text: string,
    sentencesPerChunk: number = 5, // how many sentences per chunk
    overlap: number = 1            // how many sentences to step back before starting the next chunk
): string[] {

    // split the text into individual sentences using a regex that matches anything ending in . ! or ?
    // the ?? [] is a safety fallback — if nothing matches, use an empty array instead of null
    const sentences = text.match(/[^.!?]+[.!?]+/g) ?? [];

    const chunks: string[] = [];

    // step through the sentences array in increments of (sentencesPerChunk - overlap)
    // subtracting overlap means we step back slightly each time, so consecutive chunks share some sentences
    for (let i = 0; i < sentences.length; i += sentencesPerChunk - overlap) {

        // slice out the next group of sentences and join them back into a single string
        const chunk = sentences.slice(i, i + sentencesPerChunk).join(" ");
        chunks.push(chunk);
    }

    return chunks;
}
