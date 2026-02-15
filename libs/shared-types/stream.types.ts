/**
 * Stream Types
 * ============
 * The "Wire" protocol between Middleware (Tier 2) and Client (Tier 1).
 * Based on: Docs/Apps/Middleware/SpecSheet.md § 5.1 & Docs/Apps/Client/SpecSheet.md § 5.2
 */

// ---------------------------------------------------------------------------
// Stream Event Types
// ---------------------------------------------------------------------------

export type StreamEventType =
    | 'token'        // Standard text generation token
    | 'thought'      // Internal reasoning trace (DeepSeek, etc.)
    | 'tool_start'   // Agent is executing a tool ("Searching the web...")
    | 'tool_result'  // Tool execution finished ("Found 5 results.")
    | 'error'        // Graceful error ("Ollama Connection Refused")
    | 'done';        // Stream complete, includes metrics

// ---------------------------------------------------------------------------
// Stream Packet
// ---------------------------------------------------------------------------

/**
 * The atomic unit sent over the SSE connection.
 * Every chunk the Client receives conforms to this shape.
 */
export interface StreamPacket {
    id: string;
    type: StreamEventType;
    payload: string | object;
    timestamp: number;
}

// ---------------------------------------------------------------------------
// Discriminated Union Helpers (for type-safe switch statements)
// ---------------------------------------------------------------------------

export type StreamEvent =
    | { type: 'token'; payload: string }
    | { type: 'thought'; payload: string }
    | { type: 'tool_start'; payload: { tool: string } }
    | { type: 'tool_result'; payload: { tool: string; result: string } }
    | { type: 'error'; payload: { message: string } }
    | { type: 'done'; payload: { metrics: Record<string, any> } };
