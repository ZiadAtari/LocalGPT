# State Management
> Rules for managing application state via Angular Signals.

## Global vs. Feature State
- **Global State**:
  - Managed by Singleton Services in `core/`.
  - **Theme**: `ThemeService` (Dark/Light mode).
  - **Auth**: *Not yet implemented* (Simple local usage).
- **Feature State**:
  - Managed by `*.store.ts` (SignalStore pattern).
  - **Chat**: `ChatStore` (Messages, Loading Status, Model Selection).

## Store Structure (ChatStore)
> The central brain of the Chat feature.

```typescript
interface ChatState {
  // The active conversation UUID
  conversationId: string | null;
  
  // Linear list of messages (User + Assistant)
  messages: ChatMessage[];
  
  // Connection status for UI spinners/disabling inputs
  connectionStatus: 'idle' | 'streaming' | 'error';
  
  // User's preferred model
  selectedModel: string;
}
```

## Persistence Strategy
> What survives a reload.

| State Slice | Mechanism | Key | Rationale |
|-------------|-----------|-----|-----------|
| **Theme** | `localStorage` | `theme-preference` | persist UI preference across sessions. |
| **Model** | `localStorage` | *Future* | Persist user's favorite model. |
| **Chat History** | **Backend API** | N/A | Reliability. Fetched via `GET /api/chat/:id` on route change. |

## Reactivity Pattern
1. **User Action** (Click Send) -> **Component** (`ChatWindow`).
2. **Component** calls **Store** (`store.addUserMessage`) -> UI updates immediately (Optimistic).
3. **Component** calls **Service** (`stream.connect`) -> Subscribes to SSE.
4. **Stream Events** -> **Store** (`store.appendToken`) -> UI updates per token.