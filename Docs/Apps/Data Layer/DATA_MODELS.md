# Data Models
> Definition of database schema entities.

## Relational Models (SQLite)

### `Conversation`
The root aggregate for chat history.
- **id**: `UUID`
- **title**: `String` (User-defined or autogen)
- **summary**: `String?` (LLM-generated synopsis)
- **tags**: `Tag[]` (Categorization)

### `Message`
An atomic unit of communication.
- **role**: `user` | `assistant` | `system`
- **content**: `String` (Markdown supported)
- **thoughtProcess**: `String?` (Chain-of-Thought)
- **toolCallId**: `String?` (For agentic flows)
- **tokenCount**: `Int?` (Usage tracking)

### `ContextReference`
Links a message to the specific knowledge chunks used to generate it (RAG attribution).
- **messageId**: `FK` -> Message
- **documentId**: `FK` -> Vector Store Document
- **score**: `Float` (Relevance 0-1)
- **snippet**: `String` (The actual context text)

## Vector Models (JSON)

### `VectorEntry`
A chunk of embedded text.
```json
{
  "id": "uuid-v4",
  "documentId": "uuid-v4",
  "text": "The quick brown fox...",
  "embedding": [0.123, -0.456, ...], // 768 dimensions
  "metadata": {
    "filename": "story.txt",
    "chunkIndex": 0
  }
}
```
