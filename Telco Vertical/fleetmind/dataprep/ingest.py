# Copyright 2026 FleetMind Authors
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

import os
import glob
import logging
import httpx
import numpy as np
import redis
from redis.commands.search.field import VectorField, TextField
from redis.commands.search.indexDefinition import IndexDefinition, IndexType
from typing import List, Dict, Any

from fleetmind.dataprep.parser import parse_and_cluster_logs

logger = logging.getLogger("fleetmind.ingest")

INDEX_NAME = "idx:fleetmind"
DOC_PREFIX = "doc:"
VECTOR_DIM = 384 # BAAI/bge-small-en-v1.5 has 384 dimensions

def get_redis_client() -> redis.Redis:
    host = os.getenv("REDIS_HOST", "localhost")
    port = int(os.getenv("REDIS_PORT", 6379))
    # decode_responses must be False because vector search returns raw bytes for floats
    return redis.Redis(host=host, port=port, decode_responses=False)

def init_index():
    """Initializes the Redis vector search index if it doesn't already exist."""
    r = get_redis_client()
    try:
        r.ft(INDEX_NAME).info()
        logger.info(f"Index '{INDEX_NAME}' already exists.")
    except Exception:
        logger.info(f"Creating RediSearch index '{INDEX_NAME}'...")
        schema = (
            TextField("text"),
            TextField("doc_type"),
            TextField("source"),
            TextField("error_code"),
            TextField("device_model"),
            TextField("firmware"),
            TextField("region"),
            VectorField(
                "vector",
                "HNSW",
                {
                    "TYPE": "FLOAT32",
                    "DIM": VECTOR_DIM,
                    "DISTANCE_METRIC": "COSINE",
                    "M": 16,
                    "EF_CONSTRUCTION": 200,
                }
            )
        )
        definition = IndexDefinition(prefix=[DOC_PREFIX], index_type=IndexType.HASH)
        r.ft(INDEX_NAME).create_index(fields=schema, definition=definition)
        logger.info(f"Index '{INDEX_NAME}' created successfully.")

def get_embedding(text: str) -> List[float]:
    """Queries the TEI embedding service to generate an embedding vector."""
    emb_host = os.getenv("EMBEDDING_HOST", "localhost")
    emb_port = int(os.getenv("EMBEDDING_PORT", 8080))
    url = f"http://{emb_host}:{emb_port}/embed"
    
    try:
        response = httpx.post(url, json={"inputs": text}, timeout=10.0)
        response.raise_for_status()
        res = response.json()
        # TEI format can be [float, float...] or [[float, float...]]
        if isinstance(res, list):
            if isinstance(res[0], list):
                return res[0]
            return res
        elif isinstance(res, dict) and "embedding" in res:
            return res["embedding"]
        raise ValueError(f"Unexpected embedding format: {res}")
    except Exception as e:
        logger.error(f"Failed to generate embedding: {e}")
        # fallback to zero vector for safety/testing
        return [0.0] * VECTOR_DIM

def chunk_markdown(file_path: str, chunk_size: int = 512, overlap: int = 64) -> List[Dict[str, Any]]:
    """Splits a markdown document into overlapping text chunks (~512 words)."""
    if not os.path.exists(file_path):
        return []
        
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()
        
    words = content.split()
    chunks = []
    
    source_name = os.path.basename(file_path)
    
    idx = 0
    chunk_count = 0
    while idx < len(words):
        chunk_words = words[idx : idx + chunk_size]
        chunk_text = " ".join(chunk_words)
        
        chunks.append({
            "text": chunk_text,
            "metadata": {
                "doc_type": "knowledge_base",
                "source": source_name,
                "chunk_id": f"chunk_{chunk_count}",
                "error_code": "",
                "device_model": "",
                "firmware": "",
                "region": ""
            }
        })
        idx += (chunk_size - overlap)
        chunk_count += 1
        
    return chunks

def ingest_document(chunk: Dict[str, Any], doc_id: str):
    """Saves a chunk text, metadata, and embedding vector to Redis."""
    r = get_redis_client()
    text = chunk["text"]
    meta = chunk["metadata"]
    
    # Generate embedding
    vector = get_embedding(text)
    
    # Convert vector list to raw float32 bytes for Redis
    vector_bytes = np.array(vector, dtype=np.float32).tobytes()
    
    # Save as hash
    doc_key = f"{DOC_PREFIX}{doc_id}"
    r.hset(doc_key, mapping={
        "text": text,
        "doc_type": meta["doc_type"],
        "source": meta["source"],
        "error_code": meta.get("error_code", ""),
        "device_model": meta.get("device_model", ""),
        "firmware": meta.get("firmware", ""),
        "region": meta.get("region", ""),
        "vector": vector_bytes
    })

def ingest_kb_directory(kb_dir: str):
    """Reads and ingests all markdown files from a knowledge base directory."""
    logger.info(f"Ingesting KB files from {kb_dir}...")
    md_files = glob.glob(os.path.join(kb_dir, "*.md"))
    for file_path in md_files:
        chunks = chunk_markdown(file_path)
        for i, chunk in enumerate(chunks):
            doc_id = f"kb_{os.path.basename(file_path)}_{i}"
            ingest_document(chunk, doc_id)
    logger.info(f"Ingested {len(md_files)} KB documents.")

def ingest_telemetry_logs(log_paths: List[str]):
    """Clusters telemetry logs and ingests the resulting anomaly summaries."""
    logger.info(f"Ingesting telemetry logs: {log_paths}")
    anomaly_chunks = parse_and_cluster_logs(log_paths)
    for i, chunk in enumerate(anomaly_chunks):
        doc_id = f"telemetry_{i}_{chunk['metadata']['error_code']}_{chunk['metadata']['region']}"
        ingest_document(chunk, doc_id)
    logger.info(f"Ingested {len(anomaly_chunks)} anomaly clusters.")

def query_vector_index(query: str, top_k: int = 5, filters: Dict[str, Any] = None) -> List[Dict[str, Any]]:
    """Performs vector search in Redis for a given query."""
    r = get_redis_client()
    
    # Get query embedding
    query_vector = get_embedding(query)
    query_vector_bytes = np.array(query_vector, dtype=np.float32).tobytes()
    
    # Construct base query with optional filters
    filter_expr = "*"
    if filters:
        filter_parts = []
        for k, v in filters.items():
            if v:
                filter_parts.append(f"@{k}:{v}")
        if filter_parts:
            filter_expr = " ".join(filter_parts)
            
    # RediSearch FT.SEARCH syntax:
    # FT.SEARCH index "filter_expr=>[VECTOR_RANGE_OR_KNN_EXPR]" PARAMS 2 query_vector ... DIALECT 2
    # For KNN vector search: "(*)=>[KNN $K @vector $query_vector]"
    redis_query_str = f"({filter_expr})=>[KNN {top_k} @vector $query_vector]"
    
    # Prepare FT.SEARCH execution via raw redis command or ft().search()
    # It's safer to use raw execute_command because decode_responses settings won't break return values
    from redis.commands.search.query import Query
    q = Query(redis_query_str).sort_by("__vector_score").paging(0, top_k).return_fields("text", "doc_type", "source", "error_code", "device_model", "firmware", "region", "__vector_score").dialect(2)
    
    res = r.ft(INDEX_NAME).search(q, query_params={"query_vector": query_vector_bytes})
    
    results = []
    # res.docs is a list of Document objects containing properties
    for doc in res.docs:
        # Note: doc properties are returned as bytes or strings depending on connection, decode values manually
        def val_str(val):
            if isinstance(val, bytes):
                return val.decode("utf-8", errors="ignore")
            return str(val)
            
        results.append({
            "text": val_str(getattr(doc, "text", "")),
            "score": float(getattr(doc, "__vector_score", 1.0)),
            "metadata": {
                "doc_type": val_str(getattr(doc, "doc_type", "")),
                "source": val_str(getattr(doc, "source", "")),
                "error_code": val_str(getattr(doc, "error_code", "")),
                "device_model": val_str(getattr(doc, "device_model", "")),
                "firmware": val_str(getattr(doc, "firmware", "")),
                "region": val_str(getattr(doc, "region", "")),
            }
        })
        
    return results
