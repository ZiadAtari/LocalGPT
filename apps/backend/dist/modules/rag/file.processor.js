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
const OCR_PROMPT = `Extract ALL text from this document page as clean, structured Markdown.

Rules:
- Preserve headings (use # for H1, ## for H2, etc.)
- Preserve tables using standard Markdown table syntax
- Preserve lists (ordered and unordered)
- Preserve bold (**text**) and italic (*text*) formatting
- Do NOT add any commentary, explanation, or tags
- Do NOT wrap the output in code blocks
- Output ONLY the extracted text in Markdown format`;
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
            pageCount: 0,
            status: 'processing',
            progress: 0,
            createdAt: new Date().toISOString(),
        };
        this.documents.set(documentId, metadata);
        this.logger.log(`Processing document: ${originalFilename} (ID: ${documentId})`);
        try {
            let text;
            if (ext === '.pdf') {
                metadata.status = 'processing';
                text = await this.extractPdfText(filePath, metadata);
            }
            else {
                text = fs.readFileSync(filePath, 'utf-8');
                metadata.pageCount = 1;
            }
            if (!text || text.trim().length === 0) {
                throw new Error('No text could be extracted from the file.');
            }
            metadata.progress = 60;
            this.logger.log(`Extracted ${text.length} chars from ${originalFilename}`);
            const chunks = this.chunkText(text, 500, 100);
            this.logger.log(`Split into ${chunks.length} chunks (sizes: ${chunks.map(c => c.length).join(', ')})`);
            metadata.status = 'embedding';
            metadata.progress = 70;
            this.logMemory('before-embedding');
            const entries = [];
            for (let i = 0; i < chunks.length; i++) {
                const chunkText = chunks[i];
                try {
                    this.logger.log(`Embedding chunk ${i + 1}/${chunks.length} (${chunkText.length} chars)...`);
                    const embedding = await this.ollama.embed(chunkText);
                    if (!Array.isArray(embedding) || embedding.length === 0) {
                        this.logger.warn(`Chunk ${i}: invalid embedding, skipping`);
                        continue;
                    }
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
                    this.logger.log(`✓ Chunk ${i + 1} embedded (dim=${embedding.length})`);
                }
                catch (embedErr) {
                    this.logger.warn(`Failed to embed chunk ${i}: ${embedErr.message}`);
                }
                metadata.progress = 70 + Math.round(((i + 1) / chunks.length) * 25);
            }
            this.logMemory('after-embedding');
            if (entries.length > 0) {
                this.logger.log(`Storing ${entries.length} vectors...`);
                this.vectorStore.addEntries(entries);
            }
            else {
                this.logger.warn('No valid embeddings produced — nothing to store');
            }
            metadata.chunkCount = entries.length;
            metadata.status = 'ready';
            metadata.progress = 100;
            this.logger.log(`✅ Document "${originalFilename}" ready: ${entries.length} vectors stored`);
            return metadata;
        }
        catch (err) {
            metadata.status = 'failed';
            metadata.error = err.message;
            this.logger.error(`❌ Failed to process "${originalFilename}": ${err.message}`);
            this.logger.error(err.stack || '(no stack trace)');
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
    async extractPdfText(filePath, metadata) {
        const pdfjsLib = await Promise.resolve().then(() => require('pdfjs-dist/legacy/build/pdf.mjs'));
        const fileBuffer = fs.readFileSync(filePath);
        const pdfDoc = await pdfjsLib.getDocument({
            data: new Uint8Array(fileBuffer),
            useSystemFonts: true,
        }).promise;
        metadata.pageCount = pdfDoc.numPages;
        metadata.progress = 10;
        this.logger.log(`PDF has ${pdfDoc.numPages} pages`);
        const pageTexts = [];
        for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
            const page = await pdfDoc.getPage(pageNum);
            const textContent = await page.getTextContent();
            const pageText = textContent.items
                .filter((item) => 'str' in item)
                .map((item) => item.str)
                .join(' ')
                .replace(/\s+/g, ' ')
                .trim();
            if (pageText.length > 0) {
                pageTexts.push(pageText);
            }
            else {
                this.logger.warn(`Page ${pageNum} has no extractable text (possibly scanned/image-only)`);
                pageTexts.push(`[No text extracted from page ${pageNum}]`);
            }
            const pageProgress = 10 + Math.round((pageNum / pdfDoc.numPages) * 45);
            metadata.progress = pageProgress;
            this.logger.log(`Extracted text from page ${pageNum}/${pdfDoc.numPages}`);
        }
        metadata.progress = 58;
        return pageTexts
            .filter(text => !text.startsWith('[No text'))
            .join('\n\n---\n\n');
    }
    async preprocessImage(imageBuffer) {
        const sharp = (await Promise.resolve().then(() => require('sharp'))).default;
        return sharp(imageBuffer)
            .grayscale()
            .normalize()
            .sharpen({ sigma: 1.0 })
            .png()
            .toBuffer();
    }
    postProcess(pageTexts) {
        const cleanedPages = pageTexts.map((text, index) => {
            let cleaned = text;
            cleaned = cleaned.replace(/<\|ref\|>/g, '');
            cleaned = cleaned.replace(/<\|\/ref\|>/g, '');
            cleaned = cleaned.replace(/<\|grounding\|>/g, '');
            cleaned = cleaned.replace(/<\|\/grounding\|>/g, '');
            cleaned = cleaned.replace(/<\|endoftext\|>/g, '');
            cleaned = cleaned.replace(/^```(?:markdown)?\n?/gm, '');
            cleaned = cleaned.replace(/\n?```$/gm, '');
            cleaned = cleaned.trim();
            return cleaned;
        });
        return cleanedPages
            .filter((text) => text.length > 0 && !text.startsWith('[OCR Error'))
            .join('\n\n---\n\n');
    }
    chunkText(text, chunkSize, overlap) {
        if (!text || text.length === 0)
            return [];
        if (text.length <= chunkSize) {
            return [text.trim()].filter(c => c.length > 0);
        }
        const chunks = [];
        const step = chunkSize - overlap;
        for (let start = 0; start < text.length; start += step) {
            let end = Math.min(start + chunkSize, text.length);
            if (end < text.length) {
                const searchFrom = Math.max(start, end - 100);
                const snippet = text.substring(searchFrom, end);
                const breakPoints = ['\n\n', '.\n', '. ', '! ', '? ', '\n', ', '];
                for (const bp of breakPoints) {
                    const idx = snippet.lastIndexOf(bp);
                    if (idx !== -1 && idx > 20) {
                        end = searchFrom + idx + bp.length;
                        break;
                    }
                }
            }
            const chunk = text.substring(start, end).trim();
            if (chunk.length > 0) {
                chunks.push(chunk);
            }
            if (end >= text.length)
                break;
        }
        return chunks;
    }
    logMemory(label) {
        const mem = process.memoryUsage();
        const mb = (bytes) => (bytes / 1024 / 1024).toFixed(1);
        this.logger.log(`[Memory:${label}] heap=${mb(mem.heapUsed)}/${mb(mem.heapTotal)}MB, rss=${mb(mem.rss)}MB`);
    }
};
exports.FileProcessor = FileProcessor;
exports.FileProcessor = FileProcessor = FileProcessor_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [ollama_wrapper_1.OllamaWrapper,
        vector_store_1.VectorStoreService])
], FileProcessor);
//# sourceMappingURL=file.processor.js.map