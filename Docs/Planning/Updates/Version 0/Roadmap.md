# LocalGPT Development Roadmap

**Goal:** Build a local, privacy-first "Forever Stack" for LLM interactions using Angle, NestJS, SQLite, ChromaDB, and Ollama.

## Phase 1: Foundation (The Skeleton)
**Objective:** Establish the core communication pipeline between Client, Middleware, and Engine.
- [ ] **Infrastructure**: Create `docker-compose.yml` for Ollama and ChromaDB (even if unused initially).
- [ ] **Backend (Tier 2)**: Initialize NestJS project (`apps/backend`).
  - [ ] Implement `OllamaService` (using `ollama` lib).
  - [ ] Create `StreamNormalizer` to handle "thinking" tags from DeepSeek.
  - [ ] Expose `POST /api/chat/stream` SSE endpoint.
- [ ] **Frontend (Tier 1)**: Initialize Angular project (`apps/frontend`).
  - [ ] Setup Tailwind CSS.
  - [ ] Create `StreamService` to consume SSE.
  - [ ] Build basic "Echo" Chat UI (User input -> SSE -> Markdown render).
- [ ] **Verification**: User can type a message, backend sends it to Ollama, and frontend displays the streaming response.

## Phase 2: Persistence (The Memory)
**Objective:** Enable the application to remember conversations across reloads.
- [ ] **Database**: Initialize Prisma with SQLite (`data/db/dev.db`).
- [ ] **Schema**: Define `Conversation` and `Message` models.
- [ ] **Backend**:
  - [ ] Implement `ChatHistoryService`.
  - [ ] Save messages *after* stream completion.
  - [ ] Add `GET /api/chat` to list conversations.
  - [ ] Add `GET /api/chat/:id` to load history.
- [ ] **Frontend**:
  - [ ] Add Sidebar for Chat History.
  - [ ] Implement Route parameters (`/chat/:id`).

## Phase 3: RAG & Vectors (The Brain)
**Objective:** Allow the AI to "read" and answer questions about local files.
- [ ] **Infrastructure**: Ensure ChromaDB is running via Docker.
- [ ] **Backend**:
  - [ ] Install `chromadb` client.
  - [ ] Create `VectorStoreService` (Tier 3 interface).
  - [ ] Implement `FileIngestionService`:
    - [ ] `POST /api/upload` (Multer).
    - [ ] Text Extraction (PDF/TXT).
    - [ ] Chunking & Embedding (`nomic-embed-text`).
    - [ ] Storage in ChromaDB.
  - [ ] Update `ChatService` to query vectors before calling Ollama.
- [ ] **Frontend**:
  - [ ] Add File Upload Drag-and-Drop zone.
  - [ ] Display "Citations" in chat response.

## Phase 4: Agentic Tools (The Hands)
**Objective:** Transform the chatbot into an agent that can *do* things.
- [ ] **Backend**:
  - [ ] Define `AgentPlugin` interface.
  - [ ] Implement `ToolRunner` service (The Loop).
  - [ ] Create `WebSearchPlugin` (using `ollama.webSearch` or API).
  - [ ] Create `CalculatorPlugin`.
  - [ ] Update `OllamaService` to handle `tool_calls`.
- [ ] **Frontend**:
  - [ ] Display "Tool Use" status (e.g., "Searching web...").
  - [ ] Render tool results if applicable.

## Phase 5: Polish & Optimization
**Objective:** Make it feel "Pro."
- [ ] **Security**: Sanitize inputs, enforce RAG limits.
- [ ] **Performance**: Virtual Scrolling for long chats.
- [ ] **UX**:
  - [ ] "Thinking" accordions for DeepSeek.
  - [ ] Code block syntax highlighting.
  - [ ] Copy-to-clipboard buttons.
  - [ ] Dark/Light mode toggle.
