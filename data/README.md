# Data Directory
This directory contains all persistent data for the LocalGPT application.
It is mounted as Docker volumes and should NOT be committed to source control.

## Structure
- `db/`       - SQLite database file (dev.db)
- `uploads/`  - User-uploaded files (PDFs, images, etc.)
- `vectors/`  - ChromaDB data (Docker volume)
- `models/`   - Ollama model data (Docker volume)
