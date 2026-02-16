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
var FileProcessor_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileProcessor = void 0;
const common_1 = require("@nestjs/common");
const ollama_wrapper_1 = require("../ollama/ollama.wrapper");
const vector_store_1 = require("./vector.store");
const uuid_1 = require("uuid");
const fs = require("fs");
const path = require("path");
let FileProcessor = FileProcessor_1 = class FileProcessor {
    ollama;
    vectorStore;
    logger = new common_1.Logger(FileProcessor_1.name);
    documents = new Map();
    constructor(ollama, vectorStore) {
        this.ollama = ollama;
        this.vectorStore = vectorStore;
    }
    async processFile(filePath, originalFilename) {
        const documentId = (0, uuid_1.v4)();
        const ext = path.extname(originalFilename).toLowerCase();
        const metadata = {
            documentId,
            filename: originalFilename,
            chunkCount: 0,
            status: 'processing',
            createdAt: new Date().toISOString(),
        };
        this.documents.set(documentId, metadata);
        this.logger.log(`Processing document: ${originalFilename} (ID: ${documentId})`);
        try {
            let text;
            if (ext === '.pdf') {
                text = await this.extractPdf(filePath);
            }
            else {
                text = fs.readFileSync(filePath, 'utf-8');
            }
            if (!text || text.trim().length === 0) {
                throw new Error('No text could be extracted from the file.');
            }
            this.logger.log(`Extracted ${text.length} chars from ${originalFilename}`);
            const chunks = this.chunkText(text, 500, 100);
            this.logger.log(`Split into ${chunks.length} chunks`);
            const entries = [];
            for (let i = 0; i < chunks.length; i++) {
                const chunkText = chunks[i];
                try {
                    const embedding = await this.ollama.embed(chunkText);
                    entries.push({
                        id: (0, uuid_1.v4)(),
                        documentId,
                        text: chunkText,
                        embedding,
                        metadata: {
                            filename: originalFilename,
                            chunkIndex: i,
                        },
                    });
                }
                catch (embedErr) {
                    this.logger.warn(`Failed to embed chunk ${i}: ${embedErr.message}`);
                }
                if ((i + 1) % 10 === 0) {
                    this.logger.log(`Embedded ${i + 1}/${chunks.length} chunks`);
                }
            }
            if (entries.length > 0) {
                this.vectorStore.addEntries(entries);
            }
            metadata.chunkCount = entries.length;
            metadata.status = 'ready';
            this.logger.log(`✅ Document "${originalFilename}" ready: ${entries.length} vectors stored`);
            return metadata;
        }
        catch (err) {
            metadata.status = 'failed';
            metadata.error = err.message;
            this.logger.error(`❌ Failed to process "${originalFilename}": ${err.message}`);
            return metadata;
        }
    }
    listDocuments() {
        return Array.from(this.documents.values());
    }
    getDocument(documentId) {
        return this.documents.get(documentId);
    }
    removeDocument(documentId) {
        const doc = this.documents.get(documentId);
        if (!doc)
            return false;
        this.vectorStore.removeByDocumentId(documentId);
        this.documents.delete(documentId);
        this.logger.log(`Removed document: ${doc.filename}`);
        return true;
    }
    async extractPdf(filePath) {
        try {
            let pdfParse = require('pdf-parse');
            if (pdfParse.default) {
                pdfParse = pdfParse.default;
            }
            const buffer = fs.readFileSync(filePath);
            const data = await pdfParse(buffer);
            return data.text;
        }
        catch (err) {
            this.logger.error(`PDF parsing failed: ${err.message}`);
            throw new Error(`PDF parsing failed: ${err.message}. Make sure 'pdf-parse' is installed.`);
        }
    }
    chunkText(text, chunkSize, overlap) {
        const chunks = [];
        let start = 0;
        while (start < text.length) {
            let end = start + chunkSize;
            if (end < text.length) {
                const searchRange = text.substring(end - 50, end + 50);
                const breakPoints = ['\n\n', '.\n', '. ', '! ', '? ', '\n'];
                for (const bp of breakPoints) {
                    const idx = searchRange.lastIndexOf(bp);
                    if (idx !== -1) {
                        end = end - 50 + idx + bp.length;
                        break;
                    }
                }
            }
            end = Math.min(end, text.length);
            const chunk = text.substring(start, end).trim();
            if (chunk.length > 0) {
                chunks.push(chunk);
            }
            start = end - overlap;
            if (start >= text.length)
                break;
        }
        return chunks;
    }
};
exports.FileProcessor = FileProcessor;
exports.FileProcessor = FileProcessor = FileProcessor_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [ollama_wrapper_1.OllamaWrapper,
        vector_store_1.VectorStoreService])
], FileProcessor);
//# sourceMappingURL=file.processor.js.map