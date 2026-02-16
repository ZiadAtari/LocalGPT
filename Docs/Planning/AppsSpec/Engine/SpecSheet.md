# Technical Specification: Tier 4 - The Inference Engine

**Project:** LocalGPT Architecture
**Version:** 1.0.0
**Role:** AI Model Execution & Compute
**Status:** DRAFT

## 1. Executive Summary

Tier 4 is the **Ollama Runtime**. It is the only component in the system that requires significant hardware resources (GPU/RAM).

**Primary Directive:** "The Engine."
It must be configured to:

1. **Maximize Throughput:** Utilize available GPU resources efficiently.
2. **Minimize Latency:** Use `keep_alive` strategies to prevent "Cold Starts."
3. **Secure Access:** Accept requests **only** from the Tier 2 Middleware (NestJS), rejecting direct browser traffic to prevent abuse.

---

## 2. Infrastructure & Configuration

### 2.1 Deployment Strategy

Ollama will run as a system service or a Docker container, independent of the application code.

**Environment Variables (System Level):**

| Variable | Value | Description |
| --- | --- | --- |
| `OLLAMA_HOST` | `0.0.0.0:11434` | Bind to all interfaces (required if running in Docker). |
| `OLLAMA_ORIGINS` | `http://localhost:3000` | **Security:** Only allow CORS requests from the NestJS Middleware. |
| `OLLAMA_KEEP_ALIVE` | `24h` | Keep the model loaded in VRAM by default to ensure instant responses. |
| `OLLAMA_MAX_LOADED_MODELS` | `2` | Allow 1 Chat Model + 1 Embedding Model to run simultaneously. |

### 2.2 Hardware Acceleration

* **GPU Offloading:** Ollama automatically detects CUDA (NVIDIA) or Metal (Mac).
* **CPU Fallback:** If VRAM is exceeded, layers are offloaded to system RAM.
* **Concurrency:** The system must be configured to handle **serial** inference requests (Ollama queues requests by default).

---

## 3. Model Management Strategy

We define a "Standard Standard" of models to ensure consistent application behavior. The Middleware will enforce these defaults.

### 3.1 The Model Roster

| Role | Model Name | Parameter Size | Use Case |
| --- | --- | --- | --- |
| **Reasoning** | `deepseek-r1` | 7B / 14B | Complex logic, coding, and math. Emits `<think>` tags. |
| **Chat** | `llama3` | 8B | General conversation, creative writing, high speed. |
| **Embeddings** | `nomic-embed-text` | 137M | Vector generation for RAG (Documents). |
| **Vision** | `llava` | 7B | Describing images/screenshots. |

### 3.2 Dynamic Provisioning

The Tier 2 Middleware is responsible for ensuring these models exist.

* **Check:** On startup, Tier 2 calls `ollama.list()`.
* **Action:** If a required model is missing, Tier 2 initiates `ollama.pull({ stream: true })` and pipes progress to the Frontend.

---

## 4. Operational Parameters (Request Tuning)

To get the "Pro" feel, every request sent from Tier 2 to Tier 4 must be tuned using the `Options` interface.

### 4.1 Context Window (`num_ctx`)

* **Default:** 4096 tokens.
* **RAG Mode:** When chatting with PDFs, we expand this to **8192** or **16384** (hardware permitting) to fit retrieved document chunks.
* **Implementation:** passed in `request.options.num_ctx`.

### 4.2 Temperature Settings

* **Creative Mode:** `temperature: 0.8` (Brainstorming).
* **Precise Mode:** `temperature: 0.1` (RAG / Coding).
* **Reasoning Models:** DeepSeek recommends specific low-temperature settings to prevent hallucination during the "thought" phase.

### 4.3 Performance Keep-Alive

* **Problem:** Unloading a 14GB model takes time. Reloading it takes 5-10 seconds.
* **Solution:** Every `ollama.chat` request sends `keep_alive: "60m"`.
* *Result:* The model stays hot in VRAM for 60 minutes after the last message.



---

## 5. Interface Contracts (The "Driver")

The Tier 2 Middleware uses the `ollama-js` library to drive Tier 4.

### 5.1 Chat Generation

* **Method:** `ollama.chat(request)`.
* **Stream:** Always `true`.
* **Format:** `json` mode is **only** used for the "Agent Orchestrator" to force structured tool calls. For general chat, we use standard text mode.

### 5.2 Embeddings Generation

* **Method:** `ollama.embeddings(request)`.
* **Concurrency:** These are lightweight. The Middleware manages a queue (via BullMQ) to batch these requests so they don't interrupt active chat generation.

### 5.3 Special Capability: "Thinking"

* **Feature:** DeepSeek R1 and similar models emit a `thinking` field in the response object.
* **Handling:** Tier 4 emits raw tokens. Tier 4 **does not** parse this. It is the job of Tier 2 to detect the `thinking` field and route it correctly.

---

## 6. Security & Constraints

1. **Network Isolation:** Tier 4 should **not** be exposed to the public internet. It binds to localhost or a private Docker network.
2. **Resource Caps:**
* If the user runs a 70B model on an 8GB laptop, the system will crash.
* **Guardrail:** Tier 2 checks `ollama.show()` to get model details (parameter size, quantization) and warns the user if their hardware is insufficient before loading.



---

## 7. Implementation Checklist

1. **Install Ollama:** `curl -fsSL https://ollama.com/install.sh | sh`
2. **Service Config:** Edit `/etc/systemd/system/ollama.service` to add `Environment="OLLAMA_ORIGINS=http://localhost:3000"`.
3. **Pull Base Models:**
```bash
ollama pull deepseek-r1
ollama pull nomic-embed-text

```


4. **Verify GPU:** Run `ollama ps` while generating to ensure the `PROCESSOR` column shows `100% GPU`.

---

