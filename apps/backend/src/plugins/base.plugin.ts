/**
 * Base Plugin
 * ===========
 * Abstract base class providing common functionality for all plugins.
 * Concrete plugins extend this class.
 * Based on: Docs/Apps/Middleware/SpecSheet.md § 4.2
 */
import { AgentPlugin, ToolDefinition } from '../../../../libs/shared-types';

export abstract class BasePlugin implements AgentPlugin {
    abstract name: string;
    abstract description: string;

    abstract getDefinition(): ToolDefinition;
    abstract execute(args: Record<string, any>): Promise<string>;
}
