# Storage Strategy
> Where data lives and how it is persisted.

## File Locations
Relative to project root:

| Content Type | Path | Format | Backup Priority |
|--------------|------|--------|-----------------|
| **SQL Database** | `apps/backend/prisma/dev.db` | SQLite Binary | **High** |
| **Vector Index** | `data/vectors/store.json` | JSON | **High** |
| **Raw Documents**| `data/uploads/` | PDF/TXT/MD | **Medium** |
| **App Logs** | `logs/` (Optional) | Text | Low |

## Backup Strategy
Since all state is file-based, a full backup can be achieved by copying:
1. `apps/backend/prisma/dev.db`
2. `data/` directory

**Warning**: Copying `dev.db` while the app is writing to it may result in corruption.
**Recommended**: Stop the backend service before backing up `dev.db`, or use SQLite's `.backup` command.

## Vector Store Details
The `store.json` file is a simple array of objects.
- ** Pros**: Human-readable, zero infrastructure, easy to debug.
- ** Cons**: Loads entirely into memory on startup. Write operations rewrite the whole file (slow for >100MB).
- ** Scale Limit**: ~10,000 vector chunks before startup time becomes noticeable (>5s).

## Migration Path
If the app outgrows local files:
1. **SQLite** -> **PostgreSQL** (Change connection string in `.env` + `schema.prisma`).
2. **JSON Vectors** -> **ChromaDB** / **PGVector** (Refactor `VectorStoreService`).
3. **Local Uploads** -> **S3 / MinIO** (Refactor `DocumentController`).
