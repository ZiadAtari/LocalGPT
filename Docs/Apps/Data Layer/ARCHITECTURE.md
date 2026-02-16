# Architecture
> High-level architectural decisions for the LocalGPT Data Layer.

## Core Philosophy
> "Local Forever"

The data layer is designed to be:
1.  **Transportable**: The entire application state is contained within the `data/` and `prisma/` directories, making backups as simple as copying a folder.
2.  **Serverless**: No complex database servers (Postgres/MySQL) to install or manage.
3.  **Split-Brain**: Structured data lives in **SQLite**, while unstructured vector data lives in **JSON** files.

## Technology Stack

### Relational Database
- **Engine**: **SQLite**
  - *File*: `prisma/dev.db`
  - *Role*: Stores application state (Conversations, Messages, Tags).
  - *Access*: **Prisma Client** (ORM).
  - *Migrations*: Automated via `prisma migrate`.

### Vector Database
- **Engine**: **Custom JSON Store** (In-Memory + Disk Sync)
  - *File*: `data/vectors/store.json`
  - *Role*: Stores high-dimensional embeddings for RAG.
  - *Access*: `VectorStoreService` (Middleware).
  - *Indexing*: Brute-force Cosine Similarity (Linear Scan).
    - *Note*: Sufficient for <10k segments. Future upgrade: HNSW lib or ChromaDB.

### File Storage
- **Engine**: **Local File System**
  - *Path*: `data/uploads/`
  - *Role*: Stores raw source documents (PDFs, TXT) for ingestion.
  - *Lifecycle*: Files are hashed and stored. Deletion removes both the file and its vectors.

## Data Flow
1.  **User sends message** -> Middleware saves to **SQLite**.
2.  **User uploads PDF** -> Middleware saves to **Disk**, extracts text, embeds, and saves vectors to **JSON**.
3.  **RAG Search** -> Middleware scans **JSON**, finds top-k matches, and retrieves metadata.
