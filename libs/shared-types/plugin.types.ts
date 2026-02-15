/**
 * Plugin Types
 * ============
 * The Agent Plugin interface that all backend plugins must implement.
 * Based on: Docs/Apps/Middleware/SpecSheet.md § 4.2
 */

/**
 * Ollama Tool definition shape.
 * This is passed to `ollama.chat({ tools: [...] })` to register capabilities.
 */
export interface ToolDefinition {
    type: 'function';
    function: {
        name: string;
        description: string;
        parameters: {
            type: 'object';
            properties: Record<string, { type: string; description: string }>;
            required: string[];
        };
    };
}

/**
 * The contract every Agent Plugin must implement.
 * The Middleware's PluginRegistry loads these dynamically.
 */
export interface AgentPlugin {
    /** Unique identifier, e.g. "web_search" */
    name: string;

    /** Human-readable description, e.g. "Search the web for real-time info" */
    description: string;

    /** Returns the Ollama Tool definition for this plugin. */
    getDefinition(): ToolDefinition;

    /** Executes the plugin logic with the given arguments. */
    execute(args: Record<string, any>): Promise<string>;
}
