import { BasePlugin, ToolDefinition } from '../base.plugin';
export declare class WebSearchPlugin extends BasePlugin {
    name: string;
    description: string;
    getDefinition(): ToolDefinition;
    execute(args: Record<string, any>): Promise<string>;
}
