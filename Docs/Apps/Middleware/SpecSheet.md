# Technical Specification: Tier 2 - Middleware (The Kernel)

**Project:** LocalGPT Architecture
**Version:** 1.0.0
**Role:** Orchestration, State Management, & I/O
**Status:** DRAFT

## 1. Executive Summary

Tier 2 is a **Node.js (NestJS)** application acting as the secure gateway between the Client (Tier 1) and the Inference Engine (Tier 4).

**Primary Directive:** "The Kernel."
It transforms the ephemeral, stateless nature of LLM API calls into a persistent, stateful **Agent Session**. It is responsible for:

1. **Protocol Normalization:** Converting divergent model behaviors (e.g., "Thinking" tags vs. standard text) into a single, predictable stream.
2. **Hardware Access:** managing local file systems and Vector Databases (capabilities unavailable to the Browser).
3. **Agent Orchestration:** Managing the "Loop" of Tool execution (e.g., Search -> Parse -> Answer).

---

## 2. Technology Stack

| Component | Technology | Rationale |
| --- | --- | --- |
| **Runtime** | **Node.js v20+** | Required for filesystem access and `ollama-js` Node features. |
| **Framework** | **NestJS** | Strict architecture (Modules/Providers) matching the Angular frontend. |
| **LLM Driver** | **ollama-js (Node)** | Specifically the Node version for `fs` support. |
| **Database** | **SQLite + Prisma** | Zero-config relational storage for chat history. |
| **Vector DB** | **ChromaDB** | (Running in Docker) for high-performance RAG context retrieval. |
| **Queues** | **BullMQ** | (Optional) For background PDF parsing tasks. |

---

## 3. Core Architecture

### 3.1 The "Agent Kernel" Pattern

Unlike a standard CRUD app, this system uses an **Event-Loop Architecture** for chat requests to handle Tool Use.

**The Request Lifecycle:**

1. **Input:** User sends "Calculate 5 + 5".
2. **Kernel:** Inspects active Plugins. Attaches `Calculator` tool definition to `ChatRequest`.
3. **Ollama:** Returns `tool_calls` (name: 'calculator', args: { a: 5, b: 5 }) instead of content.
4. **Kernel:** Intercepts `tool_calls`. **Stops** streaming to Client. Executes `Calculator.execute()`.
5. **Kernel:** Feeds result ("10") back to Ollama as `role: 'tool'`.
6. **Ollama:** Generates final answer "The result is 10".
7. **Kernel:** Streams final answer to Client.

### 3.2 The Stream Normalizer Service

**Problem:** Different models stream data differently.

* **Standard:** Stream of `chunk.message.content`.
* **Reasoning (DeepSeek):** Stream of `chunk.message.thinking` + `chunk.message.content`.
* **Tools:** Stream of `chunk.message.tool_calls`.

**Solution:** The Middleware normalizes these into a **Single Protocol** (SSE) for the frontend.

* **Input:** `AbortableAsyncIterator<ChatResponse>`.
* **Output:** `Observable<ServerSentEvent>`.

---

## 4. Functional Specifications

### 4.1 Module: The Chat Pipeline

**Endpoint:** `POST /api/chat`
**Responsibility:**

1. Load Chat History from SQLite (`conversation_id`).
2. Inject "System Prompt" (Context).
3. If RAG is active: Query Vector DB -> Append relevant chunks to Context.
4. Call `ollama.chat({ stream: true, ... })`.
5. **Pipe** the output through the **Stream Normalizer**.

### 4.2 Module: The Plugin System (Expansion Slots)

To ensure modularity, plugins must strictly adhere to the `AgentPlugin` interface.

**Interface Definition:**

```typescript
export interface AgentPlugin {
  name: string; // e.g. "web_search"
  description: string; // "Search the web for real-time info"
  
  // Returns the Ollama Tool definition
  getDefinition(): Tool; 
  
  // The execution logic
  execute(args: any): Promise<string>;
}

```

**Required Initial Plugins:**

1. **Local File Reader:**
* *Usage:* Uses `fs.readFile` to read text files.
* *Ollama Integration:* Uses the `encodeImage` override in `src/index.ts` if processing images/PDF pages.


2. **Web Search:**
* *Usage:* Wraps `ollama.webSearch` (if supported) or external API.
* *Tools:* Defined in `examples/websearch/websearch-tools.ts`.



### 4.3 Module: RAG Engine (Memory)

**Workflows:**

1. **Ingestion:**
* Endpoint: `POST /api/documents`.
* Action: Upload file -> Extract Text -> Chunk (500 chars) -> `ollama.embeddings()` -> Store in ChromaDB.


2. **Retrieval:**
* Action: `ollama.embeddings({ prompt: userQuery })` -> ChromaDB Query (Nearest Neighbor) -> Return Top 5 Text Chunks.



---

## 5. API Contract (The "Wire")

The Middleware communicates with the Client via **Server-Sent Events (SSE)**. This is preferred over WebSockets for simple unidirectional text streaming.

### 5.1 The Stream Event Schema

Every chunk sent to the client is a JSON object with this shape:

```typescript
type StreamEventType = 
  | 'token'       // Standard text generation
  | 'thought'     // Internal reasoning trace
  | 'tool_start'  // "Searching the web..."
  | 'tool_result' // "Found 5 results."
  | 'error'       // "Ollama Connection Refused"
  | 'done';       // Stream complete

interface StreamPacket {
  id: string;
  type: StreamEventType;
  payload: string | object;
  timestamp: number;
}

```

### 5.2 Endpoints

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/api/models` | Proxy for `ollama.list()`. Caches results for 5m. |
| `POST` | `/api/chat/init` | Creates a new `conversationId`. Returns `201 Created`. |
| `POST` | `/api/chat/stream` | **SSE Endpoint.** Body: `{ message: string, conversationId: string }`. |
| `POST` | `/api/chat/stop` | Calls `abort()` on the specific request's `AbortController`. |
| `POST` | `/api/upload` | Multer upload. Saves to `/uploads`. Triggers background embedding. |

---

## 6. Database Schema (Prisma)

```prisma
model Conversation {
  id        String    @id @default(uuid())
  title     String?
  createdAt DateTime  @default(now())
  messages  Message[]
}

model Message {
  id             String       @id @default(uuid())
  role           String       // 'user' | 'assistant' | 'system' | 'tool'
  content        String       // Final output
  thoughtProcess String?      // Stored separately for "DeepSeek" style models
  metadata       String?      // JSON: { "used_tools": ["web_search"] }
  
  conversationId String
  conversation   Conversation @relation(fields: [conversationId], references: [id])
}

```

---

## 7. Implementation Roadmap

### Phase 1: The "Passthrough" (Foundation)

1. Set up NestJS + `ollama` package.
2. Implement `OllamaService` that wraps `ollama.chat`.
3. Create the **Stream Normalizer** to handle `thinking` tags.
4. Verify SSE connection with `curl`.

### Phase 2: Persistence

1. Install Prisma + SQLite.
2. Implement `ChatHistoryService`.
3. Update `OllamaService` to save messages *after* the stream completes (on `done` event).

### Phase 3: The Kernel (Agents)

1. Implement the `AgentPlugin` interface.
2. Create the `ToolRunner` service.
3. Connect `ollama.chat` with the `tools` parameter.

---

## 8. Directory Structure (Backend)

```text
/apps/backend/src
├── /app.module.ts
├── /core
│   ├── /kernel
│   │   ├── agent.orchestrator.ts  # The Loop
│   │   └── plugin.registry.ts     # Loads Plugins
│   ├── /stream
│   │   └── stream.normalizer.ts   # The SSE Transformer
│   └── /database
│       └── prisma.service.ts
├── /modules
│   ├── /chat
│   │   ├── chat.controller.ts     # API Endpoints
│   │   └── chat.service.ts        # Business Logic
│   ├── /ollama
│   │   └── ollama.wrapper.ts      # Raw Ollama Access
│   └── /rag
│       ├── vector.store.ts        # ChromaDB Access
│       └── file.processor.ts      # PDF Parsing
└── /plugins                       # Modular Features
    ├── /base.plugin.ts
    ├── /web-search
    └── /local-io

```