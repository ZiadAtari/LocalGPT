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
var VectorStoreService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.VectorStoreService = void 0;
const common_1 = require("@nestjs/common");
const fs = require("fs");
const path = require("path");
let VectorStoreService = VectorStoreService_1 = class VectorStoreService {
    logger = new common_1.Logger(VectorStoreService_1.name);
    entries = [];
    storePath;
    constructor() {
        const dataDir = path.resolve(process.cwd(), 'data', 'vectors');
        this.storePath = path.join(dataDir, 'store.json');
    }
    async onModuleInit() {
        const dir = path.dirname(this.storePath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        if (fs.existsSync(this.storePath)) {
            try {
                const raw = fs.readFileSync(this.storePath, 'utf-8');
                this.entries = JSON.parse(raw);
                this.logger.log(`Loaded ${this.entries.length} vectors from disk`);
            }
            catch (err) {
                this.logger.warn('Failed to load vector store, starting fresh');
                this.entries = [];
            }
        }
        else {
            this.logger.log('No existing vector store found. Starting fresh.');
            this.entries = [];
        }
    }
    addEntries(entries) {
        for (const entry of entries) {
            this.entries.push(entry);
        }
        this.persist();
        this.logger.log(`Added ${entries.length} vectors (total: ${this.entries.length})`);
    }
    search(queryEmbedding, topK = 5, documentIds) {
        let pool = this.entries;
        if (documentIds?.length) {
            pool = pool.filter((e) => documentIds.includes(e.documentId));
        }
        if (pool.length === 0)
            return [];
        const scored = pool.map((entry) => ({
            entry,
            score: this.cosineSimilarity(queryEmbedding, entry.embedding),
        }));
        scored.sort((a, b) => b.score - a.score);
        return scored.slice(0, topK);
    }
    removeByDocumentId(documentId) {
        const before = this.entries.length;
        this.entries = this.entries.filter((e) => e.documentId !== documentId);
        const removed = before - this.entries.length;
        this.persist();
        this.logger.log(`Removed ${removed} vectors for document ${documentId}`);
        return removed;
    }
    listDocuments() {
        return [...new Set(this.entries.map((e) => e.documentId))];
    }
    getCount() {
        return this.entries.length;
    }
    cosineSimilarity(a, b) {
        if (a.length !== b.length)
            return 0;
        let dotProduct = 0;
        let normA = 0;
        let normB = 0;
        for (let i = 0; i < a.length; i++) {
            dotProduct += a[i] * b[i];
            normA += a[i] * a[i];
            normB += b[i] * b[i];
        }
        const denominator = Math.sqrt(normA) * Math.sqrt(normB);
        return denominator === 0 ? 0 : dotProduct / denominator;
    }
    persist() {
        try {
            fs.writeFileSync(this.storePath, JSON.stringify(this.entries), 'utf-8');
        }
        catch (err) {
            this.logger.error('Failed to persist vector store:', err);
        }
    }
};
exports.VectorStoreService = VectorStoreService;
exports.VectorStoreService = VectorStoreService = VectorStoreService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], VectorStoreService);
//# sourceMappingURL=vector.store.js.map