# Version 0.3.0: RAG, Vectors & DeepSeek-OCR

**Status:** Draft
**Type:** Feature Update (Tier 3)
**Primary Focus:** Local Document Ingestion & Semantic Search

## 1. Overview
This update introduces **Retrieve-Augmented Generation (RAG)** to LocalGPT, allowing users to chat with their local PDF documents. Unlike traditional text extraction (which fails on tables and layouts), we implement a **Vision-Language** pipeline using **DeepSeek-OCR** to "see" documents and convert them into structured Markdown.

## 2. The OCR Pipeline (DeepSeek-OCR)
We treat document parsing as a Computer Vision task, not just text extraction.

### Phase 1: Preparation (Rasterization)
- **Goal:** Convert PDF pages into high-resolution images that the model can "read."
- **Tool:** `pdf-img-convert` (Node.js).
- **Spec:**
  - Format: PNG
  - Resolution: Target **1024x1024** or higher.
  - Scaling: 2.0x - 3.0x zoom to ensure clear text rendering.

### Phase 2: Preprocessing (Contextual Compression)
- **Goal:** Optimize imagery for the model's visual tokens.
- **Tool:** `sharp`.
- **Operations:**
  - **Deskewing:** Correct rotation to ensure text is horizontal.
  - **Normalization:** Ensure consistent contrast/brightness.
  - **Dynamic Resolution:** Use "Large" mode for dense tables, "Standard" for text.

### Phase 3: Inference (Vision-Language)
- **Goal:** Extract structured Markdown (including tables) from images.
- **Model:** `deepseek-ocr` (running via Ollama).
- **Mechanism:**
  - Input: Image Buffer + Prompt.
  - Prompting: Use specific "grounding" tags to request Markdown output.
  - Output: Text + Layout tokens (e.g., `<td>` for cells).

### Phase 4: Orchestration
- **Goal:** Manage GPU resources and context windows.
- **Logic:**
  - **Pagination:** Process 1 page at a time.
  - **Concurrency:** Use `p-map` to process 2-3 pages in parallel (configurable based on VRAM).
  - **Queueing:** Prevent flooding the Ollama API.

### Phase 5: Post-Processing
- **Goal:** Create a clean, searchable document.
- **Operations:**
  - **Cleaning:** Remove `<|ref|>` or `<|grounding|>` artifact tags.
  - **Stitching:** Concatenate page-level Markdown into a single buffer.
  - **Header Mapping:** Ensure `H1` vs `H2` hierarchy is consistent across pages.

## 3. Vector Storage Strategy
Once text is extracted as Markdown:

1.  **Chunking:** Use `RecursiveCharacterTextSplitter` (aim for 500-1000 tokens with overlap).
2.  **Embedding:** Use `nomic-embed-text` (via Ollama).
3.  **Storage:** Store in **ChromaDB**.
    - **Collection:** `localgpt-rag`
    - **Metadata:** `{ filename, pageNumber, checksum }`

## 4. API Specification

### `POST /api/upload`
- **Payload:** `multipart/form-data` (File).
- **Process:**
  1. Save file to `uploads/`.
  2. Trigger `IngestionService` (Async).
  3. Return `jobId`.

### `GET /api/upload/:jobId`
- **Response:** `{ status: "processing" | "completed", progress: number }`

### `POST /api/chat/stream` (Updated)
- **Logic:**
  1. Embed user query.
  2. Query ChromaDB for top 3 relevant chunks.
  3. Inject chunks into System Prompt:
     ```text
     Context:
     [Chunk 1]
     [Chunk 2]
     ...
     Answer the question based on the context above.
     ```

## 5. Technical Requirements
- **Backend Deps:** `pdf-img-convert`, `sharp`, `p-map`, `chromadb`.
- **Infrastructure:**
  - **Ollama:** Must have `deepseek-ocr` and `nomic-embed-text` pulled.
  - **ChromaDB:** Running on port 8000 (Docker).
