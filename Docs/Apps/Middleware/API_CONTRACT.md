# API Contract
> Backend REST interfaces served by NestJS.
> Base URL: `http://localhost:3000/api`

## Authentication
> Currently **Disabled** for local-first simplicity.
> Headers required: None.

## Chat Module

### List Models
**GET** `/models`
- **Description**: Proxies `ollama.list()` to return available LLMs.
- **Response**: `200 OK`
  ```json
  [
    { "name": "deepseek-r1", "size": 4096000, "modifiedAt": "2023-..." }
  ]
  ```

### Initialize Chat
**POST** `/chat/init`
- **Payload**: `{ "title": "Optional Title" }`
- **Response**: `201 Created`
  ```json
  { "conversationId": "uuid..." }
  ```

### Stream Chat
**POST** `/chat/stream`
- **Headers**: `Accept: text/event-stream`
- **Payload**:
  ```json
  {
    "conversationId": "uuid",
    "message": "Hello world",
    "model": "deepseek-r1",
    "documentIds": ["uuid-optional"]
  }
  ```
- **Response**: `200 OK` (SSE Stream)
  - Event: `token` -> `{ "payload": "Hello" }`
  - Event: `thought` -> `{ "payload": "Thinking..." }`
  - Event: `done` -> `{ "totalTokens": 50 }`

### Stop Chat
**POST** `/chat/stop`
- **Payload**: `{ "conversationId": "uuid" }`
- **Response**: `200 OK` `{ "stopped": true }`

## RAG Module

### Upload Document
**POST** `/documents/upload`
- **Content-Type**: `multipart/form-data`
- **File**: key=`file`
- **Response**: 
  - `202 Accepted` (Processing started)
  - `200 OK` (Processed immediately)
  ```json
  {
      "documentId": "uuid",
      "status": "ready",
      "chunkCount": 42
  }
  ```

### List Documents
**GET** `/documents`
- **Response**: `200 OK` `[ { "filename": "notes.pdf", ... } ]`

### Delete Document
**DELETE** `/documents/:id`
- **Response**: `200 OK` `{ "removed": true }`

## Error Handling
- **400 Bad Request**: Invalid payload or missing file.
- **404 Not Found**: Conversation or Document ID not found.
- **500 Internal Server Error**: Deep failure (Ollama down, Disk write error).
