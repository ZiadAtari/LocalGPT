# Implementation Plan: Version 0.3.0 (RAG & DeepSeek-OCR)

This plan details the steps to implement the local RAG pipeline using **DeepSeek-OCR** for high-fidelity document parsing.

## Phase 1: Infrastructure & Setup ✅
- [x] **Dependencies**: Install required Node.js packages in `apps/backend`.
  - ~~`pdf-img-convert`~~ → Replaced with `pdfjs-dist` + `skia-canvas` (no native build tools needed)
  - `sharp` (Image preprocessing)
  - `p-map` (Concurrency control)
  - `chromadb` (Vector store client — already existed)
- [x] **Models**: Ensure Ollama models are pulled.
  - `ollama pull deepseek-ocr` (or equivalent vision model)
  - `ollama pull nomic-embed-text`

## Phase 2: Backend - RAG Module Foundation ✅ (Pre-existing)
- [x] **Module**: `src/modules/rag/rag.module.ts` — already existed.
- [x] **Vector Service**: `src/modules/rag/vector.store.ts` — already existed with full cosine similarity search.

## Phase 3: Backend - The OCR Pipeline (`FileProcessor`) ✅
Rewrote `src/modules/rag/file.processor.ts` with the 5-phase workflow.

- [x] **Phase 1: Rasterization** — `pdfjs-dist` + `skia-canvas` at 2x scale.
- [x] **Phase 2: Preprocessing** — `sharp` (grayscale, normalize, sharpen).
- [x] **Phase 3: Inference** — `OllamaWrapper.generateFromImage()` with OCR prompt.
- [x] **Phase 4: Orchestration** — `p-map` with concurrency: 2.
- [x] **Phase 5: Post-Processing** — Clean model artifacts, stitch pages.

## Phase 4: Backend - API & Chat Integration ✅ (Pre-existing)
- [x] **Upload API**: `src/modules/rag/document.controller.ts` — already existed.
- [x] **Chat Integration**: `src/modules/chat/chat.service.ts` — already had RAG context injection.
- [x] **Multimodal Support**: Added `generateFromImage()` to `OllamaWrapper`.

## Phase 5: Frontend Implementation ✅ (Pre-existing + Updated)
- [x] **Service**: `ApiService` already had `uploadDocument()`.
- [x] **Component**: `InputAreaComponent` already had drag & drop + file attachment.
- [x] **Integration**: `ChatWindowComponent` already wired `onFileAttached()`.
- [x] **Updated**: Synced `DocumentMetadata` interface with new backend fields (`pageCount`, `progress`, OCR status).

## Phase 6: Verification
- [ ] **Test OCR**: Upload a complex PDF (e.g., invoice or datasheet).
- [ ] **Verify Markdown**: Check logs to see if tables were preserved.
- [ ] **Test RAG**: Ask a question that can ONLY be answered by the document.
