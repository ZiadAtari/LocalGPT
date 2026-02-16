# Data Models
> Definition of backend domain entities and data structures.

## Persistent Entities (Prisma / SQLite)
> Stored in `prisma/dev.db`.

### Conversation
| Field | Type | Description |
|-------|------|-------------|
| `id` | String (UUID) | Primary Key |
| `title` | String | User-visible title (default: "New Chat") |
| `summary` | String? | Auto-generated summary (Future) |
| `createdAt` | DateTime | Timestamp |
| `updatedAt` | DateTime | Timestamp |
| `messages` | Message[] | Relation to messages |

### Message
| Field | Type | Description |
|-------|------|-------------|
| `id` | String (UUID) | Primary Key |
| `conversationId` | String (FK) | Foreign Key to Conversation |
| `role` | Enum | `user` \| `assistant` \| `system` |
| `content` | String | The actual message text |
| `thoughtProcess` | String? | Hidden reasoning trace (for "thinking" models) |
| `createdAt` | DateTime | Timestamp |

## Vector Store Entities (JSON)
> Stored in `data/vectors/store.json`.

```typescript
interface VectorEntry {
  id: string;          // UUID of the vector chunk
  documentId: string;  // UUID of the source document
  text: string;        // The actual text chunk used for context
  embedding: number[]; // 768-dim float array (nomic-embed-text)
  metadata: {
    filename: string;
    chunkIndex: number;
    pageNumber?: number;
  };
}
```

## Stream Protocol (SSE)
> Events emitted to the client during generation.

```typescript
type StreamEventType = 
  | 'token'       // A piece of the final response
  | 'thought'     // A piece of the reasoning process
  | 'tool_start'  // Model is calling a tool (Agentic)
  | 'tool_result' // Result of a tool call
  | 'error'       // Stream failure
  | 'done';       // Completion with usage stats

interface StreamPacket {
  id: string;
  type: StreamEventType;
  payload: string | object;
  timestamp: number;
}
```
