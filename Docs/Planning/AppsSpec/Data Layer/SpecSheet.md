# Technical Specification: Tier 3 - The Data Layer (Persistence)

**Project:** LocalGPT Architecture
**Version:** 1.0.0
**Role:** Long-term Storage & Context Retrieval
**Status:** DRAFT

## 1. Executive Summary

Tier 3 is responsible for the **durability** and **retrievability** of all system data. It effectively decouples "Memory" from "Compute."

**Primary Directive:** "The Vault."
The Data Layer must guarantee that:

1. **Conversational History** is stored relationally for structured retrieval.
2. **Knowledge (RAG)** is stored vectorially for semantic search.
3. **Binary Assets** (PDFs, Images) are stored in the file system with strict references.
4. **Privacy:** All data resides locally on the host machine.

---

## 2. Technology Stack

| Component | Technology | Rationale |
| --- | --- | --- |
| **Relational DB** | **SQLite** | Zero-config, single-file (`dev.db`), ACID compliant. Perfect for single-user local apps. |
| **ORM** | **Prisma** | Type-safe database access, auto-migrations, and seamless integration with NestJS. |
| **Vector Store** | **ChromaDB** | Industry-standard open-source vector database. Runs locally via Docker. |
| **Vector Alt.** | **LanceDB** | *Alternative:* Embedded vector DB if Docker is undesirable (runs in-process). |
| **File System** | **Node.js `fs**` | Managing raw asset storage in a local `uploads/` directory. |

---

## 3. Relational Database Design (SQLite)

This database manages the structural relationships of the application.

### 3.1 Schema Overview

We distinguish between the *Content* of a message and the *Process* (thinking) that generated it.

### 3.2 Data Models (Prisma Schema)

```prisma
// schema.prisma

datasource db {
  provider = "sqlite"
  url      = "file:./dev.db"
}

generator client {
  provider = "prisma-client-js"
}

// --- The Conversation Aggregate ---

model Conversation {
  id        String    @id @default(uuid())
  title     String    @default("New Chat")
  summary   String?   // Auto-generated 1-line summary
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
  
  messages  Message[]
  tags      Tag[]
}

// --- The Atomic Message Unit ---

model Message {
  id             String   @id @default(uuid())
  conversationId String
  conversation   Conversation @relation(fields: [conversationId], references: [id], onDelete: Cascade)
  
  role           String   // 'user', 'assistant', 'system', 'tool'
  
  // The core content
  content        String   // The actual response or user prompt
  
  // For Reasoning Models (e.g., DeepSeek)
  thoughtProcess String?  // The internal monologue (hidden by default)
  
  // For Tool Use
  toolCallId     String?  // If this message triggered a tool
  toolName       String?  // e.g. "web_search"
  toolArgs       String?  // JSON string of arguments
  
  // Context References (RAG)
  references     ContextReference[]

  createdAt      DateTime @default(now())
  tokenCount     Int?     // For tracking context window usage
}

// --- RAG Linkage ---

model ContextReference {
  id          String @id @default(uuid())
  messageId   String
  message     Message @relation(fields: [messageId], references: [id])
  
  documentId  String // Link to the Vector Store Document ID
  score       Float  // Relevance score (0.0 - 1.0)
  snippet     String // The specific text chunk used
}

// --- Organization ---

model Tag {
  id            String         @id @default(uuid())
  name          String         @unique
  conversations Conversation[]
}

```

---

## 4. Vector Database Design (RAG)

This layer stores the "Knowledge." It transforms unstructured text into mathematical vectors using Ollama's embedding models.

### 4.1 Collections Strategy

Instead of one giant bucket, we segregate vectors to improve search accuracy and latency.

| Collection Name | Content Type | Embedding Model | Usage |
| --- | --- | --- | --- |
| `library_main` | PDF/Txt Documents | `nomic-embed-text` | General Q&A with files. |
| `chat_history` | Past User Messages | `nomic-embed-text` | Long-term memory ("What did I ask you last week?"). |
| `code_snippets` | Code Files | `nomic-embed-text` | Specialized code search. |

### 4.2 The Vector Document Object

When storing a chunk in ChromaDB, the metadata is critical for filtering.

```json
{
  "id": "uuid-chunk-123",
  "embeddings": [0.123, -0.552, ...], // Generated via ollama.embeddings()
  "document": "The Q3 financial report shows a 15% increase...",
  "metadata": {
    "source_file": "q3_report.pdf",
    "page_number": 4,
    "created_at": "2023-10-27",
    "hash": "sha256-of-original-content" // For duplicate detection
  }
}

```

---

## 5. File System Storage (Assets)

We do not store binary files (PDFs, Images) in the Database. We store them on disk.

### 5.1 Directory Structure

```text
/data
  /uploads
    /2023
      /10
        /q3_report_a8f9e.pdf   # Original file
  /vectors
    /chroma                    # Docker volume mount for Vector DB
  /db
    dev.db                     # SQLite file

```

### 5.2 Storage Policy

1. **Immutability:** Once a file is processed, it is read-only.
2. **Naming:** Files are renamed to `{original_name}_{uuid}.{ext}` to prevent overwrites.
3. **Cleanup:** Deleting a document from the UI triggers a "Soft Delete" in SQLite, a "Vector Delete" in ChromaDB, but retains the physical file for 30 days (Bin).

---

## 6. Interface Contracts (Data Access Layer)

The Tier 2 Middleware communicates with Tier 3 via these Repositories.

### 6.1 `IChatRepository`

```typescript
interface IChatRepository {
  createConversation(title: string): Promise<Conversation>;
  
  addMessage(data: {
    conversationId: string;
    role: 'user' | 'assistant';
    content: string;
    thinking?: string;
  }): Promise<Message>;
  
  // Used for constructing the context window
  getRecentMessages(conversationId: string, limit: number): Promise<Message[]>;
}

```

### 6.2 `IVectorStore`

```typescript
interface IVectorStore {
  // Ingest
  addDocument(collection: string, text: string, metadata: any): Promise<void>;
  
  // Retrieval
  similaritySearch(
    collection: string, 
    queryEmbedding: number[], // From ollama.embeddings()
    limit: number
  ): Promise<SearchResult[]>;
}

```

---

## 7. Operational Workflows

### 7.1 The "Memory" Pipeline (Storing a Message)

1. **Trigger:** Stream finishes (Event: `done` received in Tier 2).
2. **Action:** Tier 2 calls `ChatRepository.addMessage()`.
3. **Data mapping:**
* `content` -> `Message.content`
* `thinking` logic -> `Message.thoughtProcess` (If model provided it).


4. **Vectorization (Background Job):**
* If the message is from the *User*, send it to the `chat_history` vector collection.
* *Benefit:* Allows the user to search their own history semantically later.



### 7.2 The "Ingestion" Pipeline (Uploading a PDF)

1. **Upload:** User uploads file via Tier 1.
2. **Storage:** Tier 2 saves file to `/data/uploads`.
3. **Processing:**
* Tier 2 reads file (using `fs`).
* Splits text into 500-token chunks with 50-token overlap.
* Calls `ollama.embeddings({ model: 'nomic-embed-text', prompt: chunk })`.


4. **Indexing:** Saves vectors + metadata to ChromaDB.

---

## 8. Backup & Restore Strategy

Because this is a local app, backup is trivial but essential.

**Backup Script (`scripts/backup.sh`):**

```bash
#!/bin/bash
# 1. Stop the app to release file locks
# 2. Copy the SQLite DB
cp ./apps/backend/prisma/dev.db ./backup/dev_$(date +%F).db
# 3. Snapshot ChromaDB
# 4. Copy the uploads folder
cp -r ./data/uploads ./backup/uploads_$(date +%F)

```

---

## 9. Implementation Steps

1. **Docker Setup:** Create `docker-compose.yml` for ChromaDB.
2. **Prisma Init:** Run `npx prisma init` inside `apps/backend`.
3. **Migration:** Define the schema above and run `npx prisma migrate dev --name init`.
4. **Seed:** Create a seed script to populate a "Welcome" conversation.
5. **Vector Client:** Install `chromadb` (JS client) in the backend.