/**
 * Main Entry Point
 * =================
 * Bootstraps the NestJS application.
 */
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);

    // Global prefix for all API routes
    app.setGlobalPrefix('api');

    // Enable CORS for the Angular dev server
    app.enableCors({
        origin: process.env.CORS_ORIGIN || 'http://localhost:4200',
        credentials: true,
    });

    const port = process.env.PORT || 3000;
    await app.listen(port);
    console.log(`🚀 Middleware (Tier 2) running on http://localhost:${port}`);
}

bootstrap();
