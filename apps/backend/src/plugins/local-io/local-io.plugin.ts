/**
 * Local I/O Plugin
 * ================
 * Reads local files from the filesystem.
 * Based on: Docs/Apps/Middleware/SpecSheet.md § 4.2
 */
import { BasePlugin } from '../base.plugin';
import { ToolDefinition } from '../../../../../libs/shared-types';

export class LocalIOPlugin extends BasePlugin {
    name = 'local_file_reader';
    description = 'Read the contents of a local text file.';

    getDefinition(): ToolDefinition {
        return {
            type: 'function',
            function: {
                name: this.name,
                description: this.description,
                parameters: {
                    type: 'object',
                    properties: {
                        filePath: { type: 'string', description: 'Absolute path to the file to read.' },
                    },
                    required: ['filePath'],
                },
            },
        };
    }

    async execute(args: Record<string, any>): Promise<string> {
        // TODO: Implement fs.readFile with sanitization
        return `Contents of: ${args.filePath}`;
    }
}
