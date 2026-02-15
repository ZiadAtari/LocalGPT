/**
 * Chat Module
 * ===========
 * Wires together the Chat pipeline: Controller, Service, and dependencies.
 */
import { Module } from '@nestjs/common';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { OllamaModule } from '../ollama/ollama.module';
import { PrismaService } from '../../core/database/prisma.service';
import { StreamNormalizer } from '../../core/stream/stream.normalizer';

@Module({
    imports: [OllamaModule],
    controllers: [ChatController],
    providers: [ChatService, PrismaService, StreamNormalizer],
    exports: [ChatService],
})
export class ChatModule { }
