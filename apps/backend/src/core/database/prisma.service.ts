/**
 * Prisma Service
 * ==============
 * NestJS wrapper around the Prisma Client for SQLite access.
 * Based on: Docs/Apps/Data Layer/SpecSheet.md § 3.2
 */
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
    async onModuleInit() {
        await this.$connect();
        console.log('📦 Prisma connected to SQLite');
    }

    async onModuleDestroy() {
        await this.$disconnect();
    }
}
