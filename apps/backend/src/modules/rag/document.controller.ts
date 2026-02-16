/**
 * Document Controller
 * ===================
 * REST API endpoints for document upload, listing, and deletion.
 *
 * Endpoints:
 *   POST   /api/documents/upload  - Upload a file for RAG ingestion
 *   GET    /api/documents         - List all uploaded documents
 *   GET    /api/documents/:id     - Get a specific document's metadata
 *   DELETE /api/documents/:id     - Delete a document and its vectors
 */
import {
    Controller,
    Post,
    Get,
    Delete,
    Param,
    Res,
    Req,
    HttpCode,
    HttpStatus,
    Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { FileProcessor } from './file.processor';
import { VectorStoreService } from './vector.store';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

@Controller('documents')
export class DocumentController {
    private readonly logger = new Logger(DocumentController.name);
    private readonly uploadDir: string;

    constructor(
        private readonly fileProcessor: FileProcessor,
        private readonly vectorStore: VectorStoreService,
    ) {
        // Create upload directory
        this.uploadDir = path.resolve(process.cwd(), 'data', 'uploads');
        if (!fs.existsSync(this.uploadDir)) {
            fs.mkdirSync(this.uploadDir, { recursive: true });
        }
    }

    /**
     * POST /api/documents/upload
     * Upload a file for RAG ingestion.
     *
     * We handle multipart/form-data manually to avoid multer dependency issues.
     * The file is written to data/uploads/ and then processed asynchronously.
     */
    @Post('upload')
    @HttpCode(HttpStatus.ACCEPTED)
    async uploadFile(@Req() req: Request, @Res() res: Response) {
        try {
            // Parse the raw body for file content
            const contentType = req.headers['content-type'] || '';

            if (!contentType.includes('multipart/form-data')) {
                return res.status(400).json({
                    error: 'Content-Type must be multipart/form-data',
                });
            }

            // Use a promise-based approach to collect the uploaded file
            const fileData = await this.parseMultipart(req);

            if (!fileData) {
                return res.status(400).json({
                    error: 'No file provided in the request',
                });
            }

            // Save file to uploads directory
            const safeFilename = fileData.filename.replace(/[^a-zA-Z0-9._-]/g, '_');
            const filePath = path.join(this.uploadDir, `${Date.now()}_${safeFilename}`);
            fs.writeFileSync(filePath, fileData.buffer);

            this.logger.log(`File saved: ${filePath} (${fileData.buffer.length} bytes)`);

            // Process asynchronously — respond immediately
            const metadata = await this.fileProcessor.processFile(filePath, fileData.filename);

            return res.status(metadata.status === 'ready' ? 200 : 202).json(metadata);
        } catch (err) {
            this.logger.error(`Upload failed: ${err.message}`);
            return res.status(500).json({ error: err.message });
        }
    }

    /**
     * GET /api/documents
     * List all processed documents.
     */
    @Get()
    listDocuments() {
        return this.fileProcessor.listDocuments();
    }

    /**
     * GET /api/documents/:id
     * Get metadata for a specific document.
     */
    @Get(':id')
    getDocument(@Param('id') id: string) {
        const doc = this.fileProcessor.getDocument(id);
        if (!doc) {
            return { error: 'Document not found' };
        }
        return doc;
    }

    /**
     * DELETE /api/documents/:id
     * Remove a document and all its vectors.
     */
    @Delete(':id')
    @HttpCode(HttpStatus.OK)
    removeDocument(@Param('id') id: string) {
        const removed = this.fileProcessor.removeDocument(id);
        return { removed };
    }

    /**
     * GET /api/documents/stats
     * Get vector store statistics.
     */
    @Get('stats')
    getStats() {
        return {
            totalVectors: this.vectorStore.getCount(),
            documents: this.vectorStore.listDocuments(),
        };
    }

    // -------------------------------------------------------------------
    // Private: Multipart parsing (lightweight, no multer dependency)
    // -------------------------------------------------------------------

    private parseMultipart(req: Request): Promise<{ filename: string; buffer: Buffer } | null> {
        return new Promise((resolve, reject) => {
            const chunks: Buffer[] = [];

            req.on('data', (chunk: Buffer) => chunks.push(chunk));
            req.on('end', () => {
                try {
                    const body = Buffer.concat(chunks);
                    const contentType = req.headers['content-type'] || '';
                    const boundaryMatch = contentType.match(/boundary=(.+)/);

                    if (!boundaryMatch) {
                        resolve(null);
                        return;
                    }

                    const boundary = boundaryMatch[1];
                    const boundaryBuffer = Buffer.from(`--${boundary}`);

                    // Find the file part
                    const bodyStr = body.toString('latin1');
                    const parts = bodyStr.split(`--${boundary}`);

                    for (const part of parts) {
                        if (part.includes('filename=')) {
                            // Extract filename
                            const filenameMatch = part.match(/filename="([^"]+)"/);
                            const filename = filenameMatch ? filenameMatch[1] : 'unknown';

                            // Find the start of file data (after double CRLF)
                            const headerEnd = part.indexOf('\r\n\r\n');
                            if (headerEnd === -1) continue;

                            // Get file content (remove trailing \r\n--)
                            let fileContent = part.substring(headerEnd + 4);
                            if (fileContent.endsWith('\r\n')) {
                                fileContent = fileContent.slice(0, -2);
                            }

                            resolve({
                                filename,
                                buffer: Buffer.from(fileContent, 'latin1'),
                            });
                            return;
                        }
                    }

                    resolve(null);
                } catch (err) {
                    reject(err);
                }
            });

            req.on('error', reject);
        });
    }
}
