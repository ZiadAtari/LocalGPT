"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebSearchPlugin = void 0;
const base_plugin_1 = require("../base.plugin");
class WebSearchPlugin extends base_plugin_1.BasePlugin {
    name = 'web_search';
    description = 'Search the web for real-time information.';
    getDefinition() {
        return {
            type: 'function',
            function: {
                name: this.name,
                description: this.description,
                parameters: {
                    type: 'object',
                    properties: {
                        query: { type: 'string', description: 'The search query.' },
                    },
                    required: ['query'],
                },
            },
        };
    }
    async execute(args) {
        return `Search results for: ${args.query}`;
    }
}
exports.WebSearchPlugin = WebSearchPlugin;
//# sourceMappingURL=web-search.plugin.js.map