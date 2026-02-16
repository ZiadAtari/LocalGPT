# API Contract
> The external HTTP interface provided by the Ollama Engine.
> Middleware communicates with this API.
> Official Docs: [github.com/ollama/ollama/blob/main/docs/api.md](https://github.com/ollama/ollama/blob/main/docs/api.md)

## Base URL
`http://localhost:11434/api`

## Endpoints Used

### 1. Chat Completion (Streaming)
**POST** `/chat`

| Field | Type | Description |
|-------|------|-------------|
| `model` | string | Target model (e.g., `deepseek-r1`) |
| `messages` | array | Chat history `[{ role: "user", content: "..." }]` |
| `stream` | boolean | `true` (Always enabled) |
| `options` | object | `{ num_ctx: 4096, temperature: 0.7 }` |

**Response (Streamed JSON)**:
```json
{
  "model": "deepseek-r1",
  "created_at": "2023-...",
  "message": { "role": "assistant", "content": "Hello" },
  "done": false
}
```

### 2. Generate Embeddings
**POST** `/embeddings`

| Field | Type | Description |
|-------|------|-------------|
| `model` | string | Embedding model (e.g., `nomic-embed-text`) |
| `prompt` | string | Text to embed |

**Response**:
```json
{
  "embedding": [0.54, 0.22, ...] // Array of floats
}
```

### 3. List Local Models
**GET** `/tags`

**Response**:
```json
{
  "models": [
    { "name": "deepseek-r1:latest", "size": 4096000000, ... }
  ]
}
```

### 4. Show Model Info
**POST** `/show`
- **Payload**: `{ "name": "deepseek-r1" }`
- **Response**: Details on Modelfile, parameters, and quantization.
