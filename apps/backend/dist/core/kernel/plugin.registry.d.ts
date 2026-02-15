import { AgentPlugin, ToolDefinition } from '../../plugins/base.plugin';
export declare class PluginRegistry {
    private plugins;
    register(plugin: AgentPlugin): void;
    getToolDefinitions(): ToolDefinition[];
    executePlugin(name: string, args: Record<string, any>): Promise<string>;
}
