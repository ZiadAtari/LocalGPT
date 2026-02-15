export interface ToolDefinition {
    type: 'function';
    function: {
        name: string;
        description: string;
        parameters: {
            type: 'object';
            properties: Record<string, {
                type: string;
                description: string;
            }>;
            required: string[];
        };
    };
}
export interface AgentPlugin {
    name: string;
    description: string;
    getDefinition(): ToolDefinition;
    execute(args: Record<string, any>): Promise<string>;
}
export declare abstract class BasePlugin implements AgentPlugin {
    abstract name: string;
    abstract description: string;
    abstract getDefinition(): ToolDefinition;
    abstract execute(args: Record<string, any>): Promise<string>;
}
