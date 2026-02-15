/**
 * Plugin Registry
 * ===============
 * Dynamically discovers and loads AgentPlugin implementations.
 * Based on: Docs/Apps/Middleware/SpecSheet.md § 4.2
 */
import { Injectable } from '@nestjs/common';
import { AgentPlugin, ToolDefinition } from '../../plugins/base.plugin';

@Injectable()
export class PluginRegistry {
    private plugins: Map<string, AgentPlugin> = new Map();

    /**
     * Register a plugin. Called at module init time.
     */
    register(plugin: AgentPlugin): void {
        this.plugins.set(plugin.name, plugin);
        console.log(`🔌 Plugin registered: ${plugin.name}`);
    }

    /**
     * Get all registered tool definitions (to pass to Ollama).
     */
    getToolDefinitions(): ToolDefinition[] {
        return Array.from(this.plugins.values()).map((p) => p.getDefinition());
    }

    /**
     * Look up a plugin by name and execute it.
     */
    async executePlugin(name: string, args: Record<string, any>): Promise<string> {
        const plugin = this.plugins.get(name);
        if (!plugin) {
            throw new Error(`Plugin not found: ${name}`);
        }
        return plugin.execute(args);
    }
}
