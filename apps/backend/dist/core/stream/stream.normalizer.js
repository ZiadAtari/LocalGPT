"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var StreamNormalizer_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.StreamNormalizer = void 0;
const common_1 = require("@nestjs/common");
const uuid_1 = require("uuid");
let StreamNormalizer = StreamNormalizer_1 = class StreamNormalizer {
    logger = new common_1.Logger(StreamNormalizer_1.name);
    async *normalize(stream) {
        let totalTokens = 0;
        try {
            for await (const chunk of stream) {
                if (chunk.message?.tool_calls?.length) {
                    for (const toolCall of chunk.message.tool_calls) {
                        yield this.packet('tool_start', {
                            tool: toolCall.function?.name ?? 'unknown',
                            args: toolCall.function?.arguments ?? {},
                        });
                    }
                    continue;
                }
                if (chunk.message?.thinking) {
                    yield this.packet('thought', chunk.message.thinking);
                    continue;
                }
                if (chunk.message?.content) {
                    totalTokens++;
                    yield this.packet('token', chunk.message.content);
                }
                if (chunk.done) {
                    yield this.packet('done', {
                        totalTokens,
                        totalDuration: chunk.total_duration ?? 0,
                        model: chunk.model ?? 'unknown',
                    });
                }
            }
        }
        catch (error) {
            this.logger.error(`Stream error: ${error.message}`);
            yield this.packet('error', { message: error.message });
        }
    }
    packet(type, payload) {
        return {
            id: (0, uuid_1.v4)(),
            type,
            payload,
            timestamp: Date.now(),
        };
    }
};
exports.StreamNormalizer = StreamNormalizer;
exports.StreamNormalizer = StreamNormalizer = StreamNormalizer_1 = __decorate([
    (0, common_1.Injectable)()
], StreamNormalizer);
//# sourceMappingURL=stream.normalizer.js.map