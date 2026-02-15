/**
 * App Module (Root)
 * =================
 * The root NestJS module that imports all feature modules.
 * Based on: Docs/Apps/Middleware/SpecSheet.md § 8
 */
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ChatModule } from './modules/chat/chat.module';
import { OllamaModule } from './modules/ollama/ollama.module';
import { RagModule } from './modules/rag/rag.module';
import { PrismaService } from './core/database/prisma.service';

@Module({
    imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        ChatModule,
        OllamaModule,
        RagModule,
    ],
    providers: [PrismaService],
    exports: [PrismaService],
})
export class AppModule { }
