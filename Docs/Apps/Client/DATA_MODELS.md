# Data Models
> Definition of frontend domain entities and transfer objects.

## Core Entities
> Primary domain entities used in Store and UI.

```typescript
// Chat Message (Store Entity)
export interface ChatMessage {
  id: string; // UUID
  role: 'user' | 'assistant' | 'system';
  content: string; // Markdown supported
  thoughtProcess?: string; // Reasoning trace from models like Deepseek-R1
  isStreaming: boolean; // UI state for cursor/thinking effects
  timestamp: Date;
}
```

```typescript
// Conversation Summary (Sidebar List)
export interface ConversationSummary {
  id: string;
  title: string;          // Auto-generated or first message snippet
  updatedAt: string;      // ISO Date
  messageCount: number;
}
```

```typescript
// Document (RAG Context)
export interface UploadedDocument {
  id: string;
  filename: string;
  status: 'processing' | 'ready' | 'error';
  chunkCount: number;
  uploadedAt: Date;
}
```

## Transfer Objects (DTOs)
> Payloads for API communication.

```typescript
// SSE Stream Packet
export type StreamPacket = 
  | { type: 'token'; payload: string }    // Content chunk
  | { type: 'thought'; payload: string }  // Reasoning chunk
  | { type: 'tool_start'; payload: object } // Tool execution start
  | { type: 'tool_result'; payload: object } // Tool execution result
  | { type: 'error'; payload: string }    // Stream error
  | { type: 'done'; payload: null };      // End of stream
```

## Validation Schemas
> Local validation using Zod (Future Implementation).
> Currently handled via strict TypeScript interfaces and backend validation.

```typescript
// Proposed Schema for Message Input
import { z } from 'zod';

export const SendMessageSchema = z.object({
  message: z.string().min(1, "Message cannot be empty"),
  model: z.string(),
  conversationId: z.string().uuid().optional(),
  attachedDocIds: z.array(z.string().uuid()).optional()
});
```

## Mapping Rules
> Transformations from API -> Store.

- **Dates**: Convert ISO strings (`2023-10-01T...`) to JS `Date` objects immediately upon fetch.
- **Null Handling**: Convert backend `null` thought process to empty string `''` for easier template binding.