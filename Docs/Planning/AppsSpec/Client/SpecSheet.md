# Technical Specification: Tier 1 - Client Presentation Layer

**Project:** LocalGPT Interface
**Version:** 1.0.0
**Role:** Presentation & Interaction
**Status:** DRAFT

## 1. Executive Summary

The Client Tier is a **Single Page Application (SPA)** responsible for user interaction, real-time data rendering, and media capture.

**Primary Directive:** The Client is "Logic-Light." It **never** communicates directly with the Ollama instance. It communicates exclusively with the **NestJS Middleware**. It does not perform heavy data processing (PDF parsing, Vector embedding); it delegates these tasks to the API.

## 2. Technology Stack

| Component | Technology | Rationale |
| --- | --- | --- |
| **Framework** | **Angular v17+** | Enterprise-grade structure, strict typing, and high performance. |
| **Reactivity** | **Signals** | Superior performance for fine-grained updates (e.g., streaming tokens). |
| **Async Handling** | **RxJS** | Managing WebSocket/SSE streams and HTTP event chains. |
| **Styling** | **Tailwind CSS** | Utility-first styling for rapid UI development and dark mode support. |
| **Markdown** | **ngx-markdown** | Rendering LLM responses, code blocks, and tables. |
| **State Management** | **SignalStore (ngrx)** | Lightweight, boilerplate-free state management. |

---

## 3. Core Architecture

### 3.1 Design Pattern: Smart vs. Dumb Components

To ensure modularity and testability, the application will strictly enforce the Container/Presentational pattern.

* **Smart Components (Containers):** Connect to Services/Stores. They handle `inject()`, subscriptions, and pass data down via `[input]`.
* *Examples:* `ChatWindowComponent`, `SettingsPageComponent`.


* **Dumb Components (Presentational):** Pure UI. They receive data via `input()` Signals and emit user actions via `output()`.
* *Examples:* `MessageBubbleComponent`, `TypingIndicatorComponent`, `CodeBlockComponent`.



### 3.2 Dynamic Plugin Loader

The Client must support the "Kernel & Plugin" architecture defined in the backend.

* **Concept:** The Client does not know ahead of time which plugins are active.
* **Mechanism:** A `PluginHostDirective` that dynamically instantiates UI widgets based on the `plugin_id` received in a message payload.

---

## 4. Functional Specifications

### 4.1 The Chat Interface (Core Loop)

The chat interface is the primary view. It must handle high-frequency updates without UI jank.

* **Streaming Rendering:**
* **Requirement:** The client must listen to Server-Sent Events (SSE) or WebSockets.
* **Behavior:** New tokens are appended to a `currentResponse` signal. The view updates only the text node, not the entire list.


* **"Thinking" State Visualization:**
* **Context:** Models like DeepSeek emit "thinking" blocks separate from content.
* **Spec:** The UI must parse the incoming stream for `{ type: 'thought' }` events.
* **Visual:** Render these in a collapsible `<details>` element or a distinct gray box labeled "Reasoning Process," separate from the final Markdown output.


* **Markdown & Code:**
* **Requirement:** Parse standard Markdown.
* **Code Blocks:** Must support syntax highlighting and a "Copy to Clipboard" button.



### 4.2 Multi-Modal Input

* **File Upload:**
* **UX:** Drag-and-drop zone over the chat input.
* **Action:** Files are *not* read into memory. They are `FormData` uploaded immediately to `POST /api/upload`. The response (File ID) is attached to the user's prompt.


* **Voice Input (Future Module):**
* **Spec:** Use the browser `MediaRecorder` API.
* **Protocol:** Stream `Blob` chunks via WebSocket to the Backend `VoicePlugin`.
* **Feedback:** Visual audio visualizer (waveform) to indicate recording status.



### 4.3 State Management (The Signal Store)

We will use a central Store to manage the conversation state.

**Store Structure:**

```typescript
interface ChatState {
  // The active conversation ID
  conversationId: string | null;
  // The list of messages (User + Assistant)
  messages: ChatMessage[]; 
  // Status flags
  connectionStatus: 'connected' | 'disconnected' | 'streaming';
  // The active plugin currently taking over the UI (if any)
  activePluginWidget: string | null; 
}

```

---

## 5. Interface Definitions (Shared Contracts)

The Client **must** conform to the Data Transfer Objects (DTOs) defined by the Middleware. It maps these to UI-friendly shapes.

### 5.1 The Message Object

This differs from the raw Ollama format by adding UI-specific flags.

```typescript
// src/app/models/chat.model.ts

export type MessageRole = 'user' | 'assistant' | 'system' | 'tool';

export interface UI_Message {
  id: string;
  role: MessageRole;
  
  // Content is split to handle "Thinking" models cleanly
  content: string;      // The final answer (Markdown)
  thoughtProcess?: string; // The internal monologue (optional)
  
  // Plugin Support
  toolCall?: {
    toolName: string;
    args: Record<string, any>;
    status: 'pending' | 'complete' | 'failed';
  };

  timestamp: Date;
  isStreaming: boolean; // True while the cursor is blinking
}

```

### 5.2 The Stream Event

The standard packet received from the SSE/WebSocket connection.

```typescript
// Received from Middleware
export type StreamPacket = 
  | { type: 'token'; payload: string }       // Standard text
  | { type: 'thought'; payload: string }     // Thinking token
  | { type: 'tool_start'; tool: string }     // Agent is doing something
  | { type: 'tool_end'; result: string }     // Agent finished
  | { type: 'error'; message: string }       // Graceful error handling
  | { type: 'done'; metrics: any };          // Stream finished

```

---

## 6. Directory Structure (Client Specific)

```text
/apps/frontend/src/app
├── /core
│   ├── /services
│   │   ├── api.service.ts        # HTTP Wrapper
│   │   ├── stream.service.ts     # SSE/WebSocket Handler
│   │   └── theme.service.ts      # Dark/Light Mode
│   └── /guards                   # Route Guards
├── /features
│   ├── /chat                     # The Main Module
│   │   ├── /components
│   │   │   ├── chat-window       # Smart Container
│   │   │   ├── message-list      # Dumb Component (Virtual Scroll)
│   │   │   ├── message-bubble    # Dumb Component (Markdown)
│   │   │   ├── thinking-bubble   # Dumb Component (Collapsible)
│   │   │   └── input-area        # Dumb Component (Text + File)
│   │   └── chat.store.ts         # Signal Store
│   ├── /settings                 # Configuration Module
│   └── /plugins                  # Dynamic Plugin Widgets
│       ├── /web-search-widget
│       └── /voice-widget
├── /shared
│   ├── /ui                       # Buttons, Cards, Modals
│   └── /pipes                    # MarkdownPipe, TimeAgoPipe

```

## 7. Performance Constraints & Quality Assurance

1. **Virtual Scrolling:** The chat list **must** use Virtual Scrolling (Angular CDK). Rendering 100+ DOM elements with Markdown parsing will lag the browser. Only render visible messages.
2. **Change Detection:** `OnPush` strategy is mandatory for all components.
3. **Bundle Size:**
* Lazy load the `highlight.js` library (used for code block syntax highlighting). It is heavy and not needed for the initial load.


4. **Error Handling:**
* If the Middleware disconnects, the UI must show a "Reconnecting..." toast, not crash.
* Retry logic (Exponential Backoff) for the SSE connection.



---

## 8. Next Steps for Implementation

1. **Initialize Angular:** `ng new frontend --style=scss --routing`.
2. **Setup Tailwind:** Configure `tailwind.config.js`.
3. **Create Core Services:** Implement `StreamService` to mock the connection until the Backend is ready.
4. **Build "Dumb" Components:** Start with `MessageBubbleComponent` and `InputAreaComponent` as they have no dependencies.