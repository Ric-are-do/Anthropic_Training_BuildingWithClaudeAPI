# Retrieval-Augmented Generation (RAG)

**RAG** stands for **Retrieval-Augmented Generation** — a technique where you retrieve only the relevant pieces of a document and pass those to Claude, rather than passing the entire document every time.

---

## The Problem: Why Not Just Pass the Whole Document?

The simplest approach when working with documents is to dump the entire file into the prompt and ask Claude a question about it. This works for small documents but breaks down quickly.

**Downsides of passing the whole document:**
- There's a hard limit on prompt length — your document might be too long to fit at all
- Claude becomes less effective with very long prompts
- Larger prompts cost more to process
- Larger prompts take longer to process

This approach is not RAG — it's just prompt stuffing. It's fine for small files but does not scale.

---

## The Solution: RAG — Break It Into Chunks

RAG takes a smarter approach. First, you break the document into smaller chunks during a preprocessing step. Then, when a user asks a question, you find the chunks most relevant to their question and only include those in your prompt.

Claude only ever sees the parts of the document that are actually useful for answering the question.

---

## Benefits of RAG
- Claude can focus on only the most relevant content
- Scales up to very large documents
- Works with multiple documents
- Smaller prompts cost less and run faster

---

## Challenges with RAG
- Requires a preprocessing step to chunk documents
- Need a search mechanism to find the relevant chunks
- Included chunks might not contain all the context Claude needs
- Many ways to chunk text — which approach is best?

---

## When to Use RAG

RAG involves many technical decisions and requires more work than simply including everything in a prompt. You'll need to analyze whether the benefits outweigh the complexity for your particular application. It's especially valuable when working with very large documents, multiple documents, or when you need to optimize for cost and performance.

The key insight is that RAG trades simplicity for scalability and efficiency. While it requires more upfront work to implement properly, it enables you to work with document collections that would be impossible to handle with simple prompt stuffing.
