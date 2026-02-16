# Architecture
> High-level architectural decisions for the Inference Engine.

## Core Technology
- **Engine**: **Ollama** (v0.5+)
  - *Reasoning*: The "Docker for LLMs". Provides a standardized HTTP API for running GGUF models locally.
  - *License*: MIT
  - *OS Support*: Windows (WSL2), macOS, Linux.

## Integration Pattern
The engine runs as a standalone service (daemon) and exposes an HTTP API.
- **Port**: `11434` (Default)
- **Communication**: REST / SSE
- **State**: Stateless (Context is passed in per request).

## Role in Stack
1.  **Frontend**: Does NOT talk to Ollama directly (CORS/Security).
2.  **Middleware**: Acts as the gateway/proxy.
    - Manages model pulling.
    - Enforces hardware limits (context window size).
    - Normalizes non-standard output formats (e.g., `<think>` tags).

## Hardware Strategy
> "Local Forever" implies running on consumer hardware.

- **Quantization**: Models should be 4-bit (`q4_k_m`) or smaller to fit in RAM/VRAM.
- **Offloading**: Ollama automatically offloads layers to GPU (NVIDIA/AMD) if available.
- **Fallback**: Falls back to CPU (AVX2) if no GPU is found.
