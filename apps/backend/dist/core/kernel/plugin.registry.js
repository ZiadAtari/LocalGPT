"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PluginRegistry = void 0;
const common_1 = require("@nestjs/common");
let PluginRegistry = class PluginRegistry {
    plugins = new Map();
    register(plugin) {
        this.plugins.set(plugin.name, plugin);
        console.log(`🔌 Plugin registered: ${plugin.name}`);
    }
    getToolDefinitions() {
        return Array.from(this.plugins.values()).map((p) => p.getDefinition());
    }
    async executePlugin(name, args) {
        const plugin = this.plugins.get(name);
        if (!plugin) {
            throw new Error(`Plugin not found: ${name}`);
        }
        return plugin.execute(args);
    }
};
exports.PluginRegistry = PluginRegistry;
exports.PluginRegistry = PluginRegistry = __decorate([
    (0, common_1.Injectable)()
], PluginRegistry);
//# sourceMappingURL=plugin.registry.js.map