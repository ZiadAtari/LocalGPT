# PDF Processing & RAG Pipeline Plan

## Overview
This document outlines the end-to-end flow of how PDF documents are processed in LocalGPT, from the user's file selection to the final context injection into Ollama. The goal is to enable the LLM to "read" and answer questions based on the document content.

## 1. Frontend: File Selection & Upload (Angular)
- **User Action**: The user clicks the attachment icon (paperclip) or drags and drops a PDF file into the `InputAreaComponent`.
- **Handling**:
  - The component captures the `File` object.
  - It triggers an event `(fileAttached)` which is handled by `ChatWindowComponent`.
- **API Call**:
  - `ChatWindowComponent` calls `ApiService.uploadDocument(file)`.
  - **Encoding**: The file is **not** base64 encoded manually. Instead, it is appended to a standard HTML5 `FormData` object:
    ```typescript
    const formData = new FormData();
    formData.append('file', file);
    ```
  - The browser automatically handles the `multipart/form-data` encoding, setting the correct boundaries and Content-Type headers ensuring efficient binary transfer.
  - **Endpoint**: `POST /api/documents/upload`

## 2. Backend: Ingestion & Extraction (NestJS)
- **Controller**: `DocumentController` listens on `/api/documents/upload`.
  - Uses `FileInterceptor` to handle the incoming multipart stream.
  - Saves the raw PDF file to the local filesystem (e.g., `uploads/`).
- **Processing**: The uploaded file path is passed to `FileProcessor.processFile()`.
- **Text Extraction (Decoding)**:
  - We use the library **`pdf-parse` (v1.1.1)** to read the binary PDF file.
  - `pdf-parse` extracts the raw text content from the PDF structure.
  - *Note*: Images and complex formatting are currently stripped, focusing purely on textual data.

## 3. Chunking & Preparation
Raw text from a PDF is often too long for a single LLM context window. We must break it down:
- **Cleaning**: Excessive newlines and extra spaces are normalized.
- **Chunking Strategy**:
  - The text is split into smaller segments (e.g., 1000 characters).
  - **Overlap**: We maintain an overlap (e.g., 100 characters) between chunks to ensure context isn't lost at the boundaries (e.g., a sentence split in half).
- **Result**: A single PDF becomes an array of text chunks strings.

## 4. Vectorization (Embeddings)
To make the text searchable by "meaning" rather than just keywords, we convert chunks into numbers (vectors).
- **Service**: `FileProcessor` calls `OllamaWrapper.getEmbeddings()`.
- **Ollama**:
  - We send each text chunk to Ollama's embedding model (default: `nomic-embed-text` or similar).
  - **Output**: Ollama returns a high-dimensional vector (e.g., an array of 768 floating-point numbers) representing the semantic meaning of that chunk.

## 5. Storage (Vector Store)
- **VectorStoreService**:
  - Takes the text chunk + its vector + metadata (filename, page number).
  - Stores them in a persistent store (currently a local `vector-store.json` file for simplicity, scalable to ChromaDB/pgvector later).
  - **ID Tracking**: Each document and chunk gets a unique ID to allow for deletion later.

## 6. Retrieval & Context Injection (The "RAG" Cycle)
When the user asks a question about the document:
1.  **User Query**: "What is the summary of this contract?"
2.  **Query Embedding**: `ChatService` sends this question to Ollama to generate a *query vector*.
3.  **Similarity Search**: `VectorStoreService` compares the *query vector* against all stored *document vectors* (using Cosine Similarity).
4.  **Top-K Retrieval**: The system retrieves the top 3-5 most similar text chunks.
5.  **Prompt Engineering**:
    - The retrieved text chunks are stuck together into a "Context Block".
    - A hidden System Prompt is constructed:
      > "You are a helpful AI. Use the following context to answer the user's question. consistency: \n ... [Chunk 1] ... [Chunk 2] ... \n Question: [User Query]"
6.  **Final Generation**: This augmented prompt is sent to the Ollama Chat Model (e.g., `deepseek-r1` or `llama3`), which generates the final answer using the provided PDF content.