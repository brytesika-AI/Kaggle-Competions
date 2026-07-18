# FleetMind Architecture Details

## 1. Megaservice Orchestration Flow

FleetMind implements the **OPEA Megaservice** pattern. It uses the `ServiceOrchestrator` to coordinate execution across containerized microservices:

```
[User Query]
    │
    ▼
1. Embedding Service (bge-small-en-v1.5)  ──► Generates 384-dim float32 vector
    │
    ▼
2. Redis Vector DB (idx:fleetmind)         ──► Cosine Similarity search (top-20)
    │
    ▼
3. Reranker Service (bge-reranker-base)   ──► Re-scores & filters to top-5
    │
    ▼
4. LLM Service (Qwen2.5-3B-Instruct)      ──► CPU inference generation
    │
    ▼
[Citations Grounded Response]
```

---

## 2. Ingestion & Dataprep pipeline

Raw set-top-box logs are too large to feed directly to RAG. FleetMind separates the logging stream from LLM processing:

1. **Log Parsing**: Aggregates similar events within a timeframe into a statistical cluster.
2. **Cluster Summarization**: Computes totals, unique affected decoders, average signals (SNR), and free memory levels.
3. **Database Insertion**: Vectorizes the text description of the cluster and saves it under the prefix `doc:telemetry_...` in Redis alongside the knowledge base articles.

---

## 3. Redis Database Schema

Documents are indexed as **HASH** keys in Redis:

- `text`: Text content of the chunk or anomaly summary.
- `doc_type`: Category identifier (`knowledge_base` or `telemetry_anomaly`).
- `source`: Filename or date source (e.g. `kb_tuner_lock_ref.md` or `telemetry_2026-07-01`).
- `error_code`: Anomaly reference code (if telemetry).
- `device_model`: Fictional hardware model.
- `firmware`: Device firmware version.
- `region`: Geographic identifier.
- `vector`: 384-dimensional float32 vector bytes.
