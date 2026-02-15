/my-local-llm
├── /libs
│   └── /shared-types       # Interfaces from ollama-js/src/interfaces.ts + Your DTOs
├── /apps
│   ├── /frontend           # Angular (The View)
│   │   ├── /src
│   │   │   ├── /app
│   │   │   │   ├── /services
│   │   │   │   │   └── chat-api.service.ts  # Connects to NestJS, NOT Ollama
│   │   │   │   └── /store
│   │   │   │       └── chat.store.ts        # Signal Store
│   ├── /backend            # NestJS (The Brain)
│   │   ├── /src
│   │   │   ├── /ollama
│   │   │   │   ├── ollama.service.ts        # Imports 'ollama' (Node version)
│   │   │   │   └── stream.normalizer.ts     # Handles 'thinking' vs 'content'
│   │   │   ├── /database                    # Prisma/SQLite logic
│   │   │   └── /rag                         # Vector logic
├── /docker-compose.yml     # Orchestrates ChromaDB (Optional)
└── /package.json