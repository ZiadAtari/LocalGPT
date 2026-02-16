# API Contract
> Backend interface definitions for the Client.

## Base URLs & Endpoints
> Prefix: `/api`

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/api/chat` | List all conversation summaries | No |
| `POST` | `/api/chat/init` | Create a new conversation ID | No |
| `GET` | `/api/chat/:id` | Get details/history of a conversation | No |
| `POST` | `/api/chat/stream` | Send message & start SSE stream | No |
| `POST` | `/api/chat/stop` | Abort generation for a conversation | No |
| `GET` | `/api/models` | List available LLM models | No |
| `POST` | `/api/documents/upload`| Upload file for RAG processing | No |
| `GET` | `/api/documents` | List all uploaded documents | No |
| `GET` | `/api/documents/:id` | Get document metadata | No |
| `DELETE` | `/api/documents/:id` | Delete document and vectors | No |

## Request/Response Examples

### `POST /api/chat/stream`
Start a chat generation stream.

**Request Payload**
```json
{
  "conversationId": "550e8400-e29b-41d4-a716-446655440000",
  "message": "Explain quantum entanglement",
  "model": "deepseek-r1",
  "documentIds": ["doc-123", "doc-456"]
}
```

**Response (SSE)**
```text
data: {"type": "thought", "payload": "Thinking process..."}
data: {"type": "token", "payload": "Quantum "}
data: {"type": "token", "payload": "entanglement "}
data: {"type": "done", "payload": null}
```

### `POST /api/documents/upload`
Upload a document for RAG.

**Request Payload (Multipart/Form-Data)**
- `file`: (Binary File)

**Success Response (200 OK)**
```json
{
  "documentId": "doc-123",
  "filename": "notes.pdf",
  "status": "ready",
  "chunkCount": 45
}
```

## Error Codes
> Standard HTTP status mapping.

| Status Code | Description | UI Behavior |
|-------------|-------------|-------------|
| 500 | Internal Server Error | Show generic "Connection failed" toast |
| 504 | Gateway Timeout | Retry mechanism or "Server busy" message |