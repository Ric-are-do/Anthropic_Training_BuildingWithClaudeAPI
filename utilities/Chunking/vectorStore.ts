// cosineDistance measures how different two vectors are in terms of direction.
// It is calculated as 1 - cosine similarity.
// Values close to 0 mean the vectors are very similar (text has similar meaning).
// Values close to 1 mean the vectors are very different.
function cosineDistance(a: number[], b: number[]): number {
    // dot product — multiply each pair of values and sum them up
    const dotProduct = a.reduce((sum, val, i) => sum + val * b[i]!, 0);

    // magnitude — the "length" of each vector
    const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
    const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));

    const cosineSimilarity = dotProduct / (magnitudeA * magnitudeB);

    // convert similarity (high = similar) to distance (low = similar)
    return 1 - cosineSimilarity;
}

// VectorIndex is our in-memory vector database.
// It stores embeddings alongside their original text and supports similarity search.
// In production you would replace this with Pinecone, Supabase, etc.
export class VectorIndex {

    // each entry holds the embedding vector and a metadata object containing the original text
    private vectors: { embedding: number[], metadata: Record<string, unknown> }[] = [];

    // addVector stores a chunk's embedding and its associated metadata (the original text)
    // we store both because searching returns the metadata — without the text, results are useless
    addVector(embedding: number[], metadata: Record<string, unknown>): void {
        this.vectors.push({ embedding, metadata });
    }

    // search finds the topK most similar chunks to a given query embedding
    // it compares the query vector against every stored vector using cosine distance
    // returns an array of [metadata, distance] pairs sorted from most to least relevant
    search(queryEmbedding: number[], topK: number): [Record<string, unknown>, number][] {
        const results = this.vectors.map(({ embedding, metadata }) => {
            const distance = cosineDistance(queryEmbedding, embedding);
            return [metadata, distance] as [Record<string, unknown>, number];
        });

        // sort ascending — lower distance means higher similarity, so closest matches come first
        results.sort((a, b) => a[1] - b[1]);

        return results.slice(0, topK);
    }
}
