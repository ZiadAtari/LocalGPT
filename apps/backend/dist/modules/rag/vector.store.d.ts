import { OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
export declare class VectorStoreService implements OnModuleInit {
    private readonly config;
    constructor(config: ConfigService);
    onModuleInit(): Promise<void>;
}
