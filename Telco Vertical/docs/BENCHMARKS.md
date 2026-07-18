# FleetMind Gateway Performance Benchmarks

This document describes the performance benchmarking methodology, environment, parameters, and reproducibility instructions.

---

## 1. Benchmarking Methodology

Benchmarks are run using a custom Python script (`scripts/benchmark.py`) that uses `asyncio` and `httpx` to trigger concurrent requests to the Gateway's `/v1/chat` API.

- **Request Payload**: 
  - Query: `"What are the troubleshooting steps for tuner lock failure TUN-E1042?"`
  - Parameters: `{"use_reranker": true}`
- **Test Matrix**:
  - Concurrency 1: 10 total requests.
  - Concurrency 5: 15 total requests.
  - Concurrency 10: 20 total requests.

---

## 2. Resource Utilization (llama.cpp Q4_K_M Profile)

| Container / Service | Image Pinned | Average RAM | CPU Usage (Peak) |
|---|---|---|---|
| **redis-vector-db** | `redis/redis-stack:7.2.0-v9` | ~120 MB | < 2% |
| **tei-embedding-service** | `ghcr.io/huggingface/text-embeddings-inference:cpu-1.5` | ~250 MB | ~15% (during encoding) |
| **tei-reranking-service** | `ghcr.io/huggingface/text-embeddings-inference:cpu-1.5` | ~1.1 GB | ~40% (during rerank) |
| **llm-service-llamacpp** | `ghcr.io/ggerganov/llama.cpp:server` | ~2.1 GB | ~85% (during generation) |
| **fleetmind-gateway** | (local build) | ~140 MB | < 5% |
| **TOTAL STACK** | — | **~3.7 GB** | **~100% (4 cores)** |

---

## 3. How to Reproduce Benchmarks

### Step 1: Deploy the Stack
Ensure the Docker containers are running:
```bash
bash deploy.sh
```

### Step 2: Run the Benchmark Script
Run the benchmark shell script:
```bash
bash scripts/benchmark.sh
```
The script will auto-detect the virtual environment and output average latencies, p95 latencies, and total request counts to stdout.
