# Architecture
> High-level architectural decisions for the LocalGPT Middleware (Backend).

## Tech Stack
- **Framework**: **NestJS** (Node.js)
  - *Reasoning*: Strong module system, dependency injection, and TypeScript-first approach match the complexity of an orchestrator.
- **Language**: **TypeScript 5.x**
  - *Reasoning*: Shared types with Frontend (via separate files currently, but conceptually unified).
- **Database (Relational)**: **SQLite** (via **Prisma**)
  - *Reasoning*: Zero-conf, local file-based storage fits the "Local Forever" constraint. Prisma provides type-safe access.
- **Database (Vector)**: **Local JSON** (Custom `VectorStoreService`)
  - *Reasoning*: Avoids running a heavy docker container for vector DB (like Chroma/Pinecone) for small-scale personal usage.
- **Engine Interface**: **Ollama** (via HTTP `localhost:11434`)
  - *Reasoning*: Acceptable industry standard for local inference.
- **Communication**: **REST** (CRUD) + **SSE** (Streaming)
  - *Reasoning*: SSE is simpler than WebSockets for unidirectional token streaming.

## Patterns & Modules
> Modular Monolith structure.

- **Core Module**: Global singletons (`PrismaService`, `Config`, `StreamNormalizer`).
- **Feature Modules**:
  - `ChatModule`: Orchestrates conversation flow.
  - `RagModule`: Handles document ingestion and vector search.
  - `OllamaModule`: Low-level wrapper for the inference engine.

## Constraints
1.  **No External APIs**: System must work 100% offline. No calls to OpenAI, Anthropic, or cloud vector stores.
2.  **Stateless API**: All state must be persisted to SQLite/Disk. No in-memory conversation state (except active stream handles).
3.  **Low Dependency Count**: Prefer `fetch` / native Node APIs over heavy libraries (e.g., usage of `pdf-parse` instead of heavy OCR tools).
