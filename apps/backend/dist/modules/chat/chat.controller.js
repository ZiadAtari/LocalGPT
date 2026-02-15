"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatController = void 0;
const common_1 = require("@nestjs/common");
const chat_service_1 = require("./chat.service");
const ollama_wrapper_1 = require("../ollama/ollama.wrapper");
let ChatController = class ChatController {
    chatService;
    ollama;
    constructor(chatService, ollama) {
        this.chatService = chatService;
        this.ollama = ollama;
    }
    async listModels() {
        const result = await this.ollama.listModels();
        return result.models.map((m) => ({
            name: m.name,
            size: m.size,
            modifiedAt: m.modified_at,
        }));
    }
    async initConversation(body) {
        const conversation = await this.chatService.createConversation(body?.title);
        return { conversationId: conversation.id };
    }
    async listConversations() {
        return this.chatService.listConversations();
    }
    async getConversation(id) {
        return this.chatService.getConversation(id);
    }
    async streamChat(body, res) {
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.setHeader('X-Accel-Buffering', 'no');
        res.flushHeaders();
        try {
            const stream = this.chatService.streamChat(body.conversationId, body.message, body.model ?? 'deepseek-r1');
            for await (const packet of stream) {
                res.write(`event: ${packet.type}\n`);
                res.write(`data: ${JSON.stringify(packet)}\n\n`);
            }
        }
        catch (error) {
            res.write(`event: error\n`);
            res.write(`data: ${JSON.stringify({ type: 'error', payload: { message: error.message } })}\n\n`);
        }
        finally {
            res.end();
        }
    }
    async stopChat(body) {
        const stopped = this.chatService.stopStream(body.conversationId);
        return { stopped };
    }
};
exports.ChatController = ChatController;
__decorate([
    (0, common_1.Get)('models'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "listModels", null);
__decorate([
    (0, common_1.Post)('chat/init'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "initConversation", null);
__decorate([
    (0, common_1.Get)('chat'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "listConversations", null);
__decorate([
    (0, common_1.Get)('chat/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "getConversation", null);
__decorate([
    (0, common_1.Post)('chat/stream'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "streamChat", null);
__decorate([
    (0, common_1.Post)('chat/stop'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "stopChat", null);
exports.ChatController = ChatController = __decorate([
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [chat_service_1.ChatService,
        ollama_wrapper_1.OllamaWrapper])
], ChatController);
//# sourceMappingURL=chat.controller.js.map