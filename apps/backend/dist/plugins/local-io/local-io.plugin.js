"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LocalIOPlugin = void 0;
const base_plugin_1 = require("../base.plugin");
class LocalIOPlugin extends base_plugin_1.BasePlugin {
    name = 'local_file_reader';
    description = 'Read the contents of a local text file.';
    getDefinition() {
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
    async execute(args) {
        return `Contents of: ${args.filePath}`;
    }
}
exports.LocalIOPlugin = LocalIOPlugin;
//# sourceMappingURL=local-io.plugin.js.map