# Model Inventory
> Supported and recommended models for LocalGPT.

## 1. Chat Models (Inference)
> Used for generating responses in the chat interface.

| Model | Size (Parameters) | Quantization | VRAM Required | Use Case |
|-------|-------------------|--------------|---------------|----------|
| **DeepSeek-R1** | 7B | Q4_K_M | ~4.5 GB | **Default**. Excellent reasoning and coding capabilities. |
| **Llama 3** | 8B | Q4_K_M | ~5.0 GB | General purpose, good instruction following. |
| **Mistral** | 7B | Q4_K_M | ~4.5 GB | Fast, efficient, good for smaller GPUs. |
| **Phi-3** | 3.8B | Q4_K_M | ~2.5 GB | **Low-spec**. Good for older laptops without dedicated GPU. |

## 2. Embedding Models (RAG)
> Used for converting text to vectors.

| Model | Dimensions | VRAM Required | Context Length |
|-------|------------|---------------|----------------|
| **nomic-embed-text** | 768 | ~0.5 GB | 8192 | **Default**. High quality, optimized for RAG. |
| **all-minilm** | 384 | ~0.2 GB | 512 | Faster, but lower quality and short context. |

## 3. Tool-Use Models (Agentic)
> Models capable of structured output and function calling.

- **Llama 3 (Groq/Local)**: Good tool support.
- **DeepSeek-R1**: Strong reasoning, but custom promtping needed for tools.
- **Mistral**: Native function calling support in newer versions.

## Pulling Models
To install a model, run:
```bash
ollama pull deepseek-r1
ollama pull nomic-embed-text
```
