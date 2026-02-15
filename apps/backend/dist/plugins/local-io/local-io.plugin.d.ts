import { BasePlugin, ToolDefinition } from '../base.plugin';
export declare class LocalIOPlugin extends BasePlugin {
    name: string;
    description: string;
    getDefinition(): ToolDefinition;
    execute(args: Record<string, any>): Promise<string>;
}
