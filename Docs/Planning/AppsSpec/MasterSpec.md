# Master Architecture Specification: The Local "Forever" Stack

**Project:** LocalGPT Interface
**Version:** 1.0.0
**Scope:** End-to-End System Design

## 1. System Topology

The system is designed as a **Hub-and-Spoke** network. The **Middleware (Tier 2)** is the Hub. All other components (UI, Database, AI Engine) are Spokes that only communicate with the Hub.

```mermaid
graph TD
    User((User))
    
    subgraph "Tier 1: Presentation"
        UI[Angular Client]
    end
    
    subgraph "Tier 2: The Hub (Middleware)"
        API[NestJS Gateway]
        Agent[Agent Orchestrator]
    end
    
    subgraph "Tier 3: Persistence"
        SQLite[(SQLite: History)]
        Chroma[(ChromaDB: Vectors)]
        FS[File System: Assets]
    end
    
    subgraph "Tier 4: Computation"
        Ollama[Ollama Engine]
    end

    User <-->|HTTPS / WSS| UI
    UI <-->|HTTP / SSE| API
    
    API <-->|SQL| SQLite
    API <-->|gRPC/HTTP| Chroma
    API <-->|I/O| FS
    
    API <-->|HTTP (Stream)| Ollama

```

---

## 2. Tier Integration Summary

| Tier | Component | Role | Interacts With | Protocol |
| --- | --- | --- | --- | --- |
| **1** | **Angular Client** | Visual Interface, Input Capture | Tier 2 | HTTPS, SSE |
| **2** | **NestJS API** | Orchestration, Auth, Stream Norm. | Tier 1, 3, 4 | HTTP, Internal I/O |
| **3** | **Data Layer** | History (SQLite), RAG (Chroma) | Tier 2 | SQL, API |
| **4** | **Ollama** | Inference, Embeddings | Tier 2 | HTTP (JSON) |

---

## 3. The "Glue" (Protocols & Interfaces)

### 3.1 Client <-> Middleware (The "Chat Protocol")

We use **Server-Sent Events (SSE)** for the primary chat stream because it is robust, firewall-friendly, and natively supports auto-reconnection.

* **Endpoint:** `POST /api/chat/stream`
* **Payload (Request):**
```json
{
  "model": "deepseek-r1",
  "messages": [...],
  "tools": ["web_search", "calculator"]
}

```


* **Payload (Response Stream):**
```text
event: thought
data: "Analyzing the user's request..."

event: token
data: "The"

event: token
data: " answer"

```

### 3.2 Middleware <-> Engine (The "Driver Protocol")

We use the **Ollama REST API** (wrapped by `ollama-js` Node library).

* **Constraint:** The Middleware acts as a *Rate Limiter*. It ensures we do not send a chat request while an embedding request is hogging the GPU.
* **Optimization:** The Middleware injects `keep_alive: -1` (infinite) during active sessions to prevent model unloading.

### 3.3 Middleware <-> Data (The "Memory Protocol")

* **Short-term:** Prisma (SQLite) handles read/write for chat lists.
* **Long-term:** ChromaDB handles vector similarity search.
* *Synchronization:* When a file is deleted in the UI, the Middleware performs a **Two-Phase Commit**:
1. Delete the file from disk.
2. Delete the vector IDs from Chroma.
3. Mark the SQLite record as `deleted`.





---

## 4. End-to-End Data Flows

### Scenario A: RAG (Chat with PDF)

*This flow demonstrates how all 4 tiers interact.*

1. **Tier 1 (UI):** User uploads `contract.pdf`.
2. **Tier 2 (API):** Receives file, saves to `/uploads`.
3. **Tier 4 (Engine):** API sends text chunks to `ollama.embeddings()`. Returns vectors.
4. **Tier 3 (DB):** API saves vectors to ChromaDB.
5. **Tier 1 (UI):** User asks: "What is the termination clause?"
6. **Tier 4 (Engine):** API embeds the question.
7. **Tier 3 (DB):** API queries ChromaDB for nearest 3 chunks.
8. **Tier 2 (API):** Constructs a prompt: `Context: {chunks}. Question: {query}`.
9. **Tier 4 (Engine):** Generates answer.
10. **Tier 1 (UI):** Displays answer with citations (e.g., "Page 4").

### Scenario B: Agentic Tool Use

*This flow demonstrates the "Loop" logic in Tier 2.*

1. **Tier 1:** User asks: "What is the weather in Tokyo?"
2. **Tier 2:** Detects `WeatherPlugin` is enabled. Sends prompt to Ollama with tool definitions.
3. **Tier 4:** Returns `tool_calls: [{ name: 'get_weather', args: { city: 'Tokyo' } }]`.
4. **Tier 2:** Intercepts this. **Does not** send to UI. Executes `WeatherPlugin`.
5. **Tier 2:** Sends result ("Sunny, 25C") back to Tier 4.
6. **Tier 4:** Generates natural language: "It is currently sunny and 25°C in Tokyo."
7. **Tier 2:** Streams this text to Tier 1.

---

## 5. Deployment Orchestration

To minimize friction, we use **Docker Compose** to define the entire stack (excluding the Angular dev server, which you likely run on host for HMR).

**`docker-compose.yml`**:

```yaml
version: '3.8'

services:
  # Tier 4: The Engine
  ollama:
    image: ollama/ollama:latest
    container_name: ollama_engine
    ports:
      - "11434:11434"
    volumes:
      - ./data/ollama:/root/.ollama
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: 1
              capabilities: [gpu]
    environment:
      - OLLAMA_KEEP_ALIVE=24h
      - OLLAMA_HOST=0.0.0.0

  # Tier 3: Vector Database
  chroma:
    image: chromadb/chroma:latest
    container_name: vector_db
    ports:
      - "8000:8000"
    volumes:
      - ./data/chroma:/chroma/chroma

  # Tier 2: Middleware (Production Mode)
  # For dev, you typically run 'npm run start:dev' locally instead of this container
  api:
    build: ./apps/backend
    container_name: nest_api
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=file:../data/db/dev.db
      - OLLAMA_HOST=http://ollama:11434
      - CHROMA_HOST=http://chroma:8000
    volumes:
      - ./data/uploads:/app/uploads
      - ./data/db:/app/data/db
    depends_on:
      - ollama
      - chroma

# Tier 1 (Angular) is usually served via Nginx in prod, 
# or just run locally during dev.

```

---

## 6. Security & Constraints

1. **The Firewall Rule:** The `ollama` container should **not** expose port `11434` to the host machine if possible. Ideally, only the `api` container should be able to reach it via the internal Docker network `backend_net`.
2. **Input Sanitization:** Tier 2 must sanitize all inputs to prevent **Prompt Injection** attacks before they reach Tier 4.
3. **Resource Guardrails:**
* **Max Upload Size:** 10MB (PDFs).
* **Max Context:** 8k tokens (prevents OOM crashes).



## 7. Final Deliverable Checklist

To declare the project "Complete," you need:

* [ ] **Frontend:** Angular App with Chat UI + Settings + Plugin Widget support.
* [ ] **Backend:** NestJS App with `OllamaService`, `AgentOrchestrator`, and `StreamNormalizer`.
* [ ] **DB:** Prisma Schema applied to a local SQLite file.
* [ ] **Docker:** Running instance of Ollama and ChromaDB.
* [ ] **Models:** Ollama models pulled and ready.