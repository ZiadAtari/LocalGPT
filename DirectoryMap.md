# LocalGPT Directory Map

```text
/LocalGPT
├── /libs
│   └── /shared-types                     # Shared interfaces & DTOs (Client + Backend)
│       ├── index.ts                      # Barrel export
│       ├── chat.types.ts                 # ChatMessage, Conversation, ChatRequest
│       ├── stream.types.ts               # StreamPacket, StreamEvent (SSE protocol)
│       ├── plugin.types.ts               # AgentPlugin, ToolDefinition
│       ├── rag.types.ts                  # VectorDocumentMetadata, SearchResult, Repository interfaces
│       └── tsconfig.json
│
├── /apps
│   ├── /backend                          # Tier 2: NestJS Middleware ("The Kernel")
│   │   ├── /prisma
│   │   │   └── schema.prisma             # Conversation, Message, ContextReference, Tag
│   │   ├── /src
│   │   │   ├── main.ts                   # Bootstrap
│   │   │   ├── app.module.ts             # Root module
│   │   │   ├── /core
│   │   │   │   ├── /database
│   │   │   │   │   └── prisma.service.ts # Prisma client wrapper
│   │   │   │   ├── /kernel
│   │   │   │   │   ├── agent.orchestrator.ts  # The Agent Loop
│   │   │   │   │   └── plugin.registry.ts     # Dynamic plugin loader
│   │   │   │   └── /stream
│   │   │   │       └── stream.normalizer.ts   # Thinking/Token/Tool normalizer
│   │   │   ├── /modules
│   │   │   │   ├── /chat
│   │   │   │   │   ├── chat.module.ts
│   │   │   │   │   ├── chat.controller.ts     # POST /api/chat/stream, init, stop
│   │   │   │   │   └── chat.service.ts        # Chat pipeline logic
│   │   │   │   ├── /ollama
│   │   │   │   │   ├── ollama.module.ts
│   │   │   │   │   └── ollama.wrapper.ts      # ollama-js wrapper
│   │   │   │   └── /rag
│   │   │   │       ├── rag.module.ts
│   │   │   │       ├── vector.store.ts        # ChromaDB client
│   │   │   │       └── file.processor.ts      # PDF ingestion pipeline
│   │   │   └── /plugins
│   │   │       ├── base.plugin.ts             # Abstract base
│   │   │       ├── /web-search
│   │   │       │   └── web-search.plugin.ts
│   │   │       └── /local-io
│   │   │           └── local-io.plugin.ts
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── nest-cli.json
│   │
│   └── /frontend                         # Tier 1: Angular Client ("The Face")
│       └── /src
│           └── /app
│               ├── /core
│               │   └── /services
│               │       ├── api.service.ts       # HTTP calls to NestJS
│               │       ├── stream.service.ts    # SSE connection handler
│               │       └── theme.service.ts     # Dark/Light mode
│               └── /features
│                   └── /chat
│                       ├── chat.store.ts        # NgRx Signal Store
│                       └── /components
│                           ├── /chat-window     # Smart container
│                           ├── /message-list    # Virtual scroll list
│                           ├── /message-bubble  # Markdown renderer
│                           ├── /thinking-bubble # Collapsible reasoning
│                           └── /input-area      # Text + file input
│
├── /data                                 # Persistent storage (Docker volumes)
│   ├── /db                               # SQLite (dev.db)
│   ├── /uploads                          # User files
│   ├── /vectors                          # ChromaDB data
│   └── /models                           # Ollama models
│
├── /Docs                                 # Specifications & Planning
│   ├── /Apps
│   │   ├── MasterSpec.md
│   │   ├── /Client/SpecSheet.md
│   │   ├── /Middleware/SpecSheet.md
│   │   ├── /Data Layer/SpecSheet.md
│   │   └── /Engine/SpecSheet.md
│   └── /Planning
│       └── Roadmap.md
│
├── docker-compose.yml                    # Ollama + ChromaDB + Backend
├── package.json                          # Root workspace scripts
└── README.md
```