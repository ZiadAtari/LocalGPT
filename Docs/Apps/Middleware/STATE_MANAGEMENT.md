# State Management
> How the Middleware manages state, persistence, and safe shutdowns.

## Persistence Strategy
> The "Local Forever" ethos means typical cloud databases are replaced by local files.

| Type | Technology | File Path | Responsibility |
|------|------------|-----------|----------------|
| **Relational** | SQLite (Prisma) | `prisma/dev.db` | Conversations, Messages, Metadata. |
| **Vector** | JSON (Custom) | `data/vectors/store.json` | Document embeddings for RAG. |
| **Files** | File System | `data/uploads/*` | Raw uploaded documents (PDF/TXT). |

## In-Memory State
> Transient state that does not survive a restart.

- **Active Streams**: `ChatService.activeStreams` (Map<conversationId, AbortController>)
  - **Purpose**: Allows the user to hit "Stop" and kill a running Ollama generation.
  - **Lifecycle**: Created on `streamChat`, removed on `done`/`error`/`stop`.

- **Vector Cache**: `VectorStoreService.entries`
  - **Purpose**: High-performance similarity search without reading disk on every token.
  - **Lifecycle**: Loaded from `store.json` on startup. Flushed to disk on every write/delete.

## Concurrency
- **Node.js Event Loop**: Handles async I/O (Ollama streams, File reads).
- **Stream Normalization**: Uses async generators (`async *`) to process tokens one-by-one, keeping memory usage low even for long generations.
