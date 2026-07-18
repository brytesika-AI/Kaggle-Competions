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

import logging
from enum import Enum
from typing import Dict, List, Any
import httpx

logger = logging.getLogger("fleetmind.orchestrator")

class ServiceType(str, Enum):
    EMBEDDING = "embedding"
    RETRIEVER = "retriever"
    RERANKER = "reranker"
    LLM = "llm"

class MicroService:
    def __init__(
        self,
        name: str,
        host: str,
        port: int,
        endpoint: str,
        service_type: ServiceType,
        use_remote_service: bool = True,
    ):
        self.name = name
        self.host = host
        self.port = port
        self.endpoint = endpoint
        self.service_type = service_type
        self.use_remote_service = use_remote_service
        self.url = f"http://{host}:{port}{endpoint}"

    async def call(self, payload: Dict[str, Any]) -> Any:
        logger.info(f"Calling microservice {self.name} at {self.url}...")
        async with httpx.AsyncClient(timeout=60.0) as client:
            try:
                response = await client.post(self.url, json=payload)
                response.raise_for_status()
                return response.json()
            except Exception as e:
                logger.error(f"Error calling microservice {self.name}: {e}")
                raise e

class ServiceOrchestrator:
    def __init__(self):
        self.services: Dict[str, MicroService] = {}
        self.flow: Dict[str, List[str]] = {}

    def add(self, service: MicroService) -> 'ServiceOrchestrator':
        self.services[service.name] = service
        return self

    def flow_to(self, from_service: MicroService, to_service: MicroService) -> 'ServiceOrchestrator':
        if from_service.name not in self.flow:
            self.flow[from_service.name] = []
        self.flow[from_service.name].append(to_service.name)
        return self

    async def schedule(self, request_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Executes the Megaservice workflow:
        1. Query -> Embedding
        2. Embedding -> Retriever (Redis Vector search)
        3. Retriever -> Reranker (optional, fallback to top-5 if disabled)
        4. Reranked Context -> LLM
        """
        # Execute Embedding
        embedding_service = self.services.get("embedding")
        if not embedding_service:
            raise ValueError("Embedding service not registered in orchestrator")
        
        query = request_data.get("query", "")
        emb_res = await embedding_service.call({"inputs": query})
        
        # OPEA TEI embedding response could be a list of floats (direct vector) or list of lists
        if isinstance(emb_res, list):
            embedding_vector = emb_res
        elif isinstance(emb_res, dict) and "embedding" in emb_res:
            embedding_vector = emb_res["embedding"]
        else:
            # fallback or nested list check
            embedding_vector = emb_res[0] if isinstance(emb_res[0], list) else emb_res

        # Execute Retriever (internal Redis helper or retriever microservice)
        retriever_service = self.services.get("retriever")
        if not retriever_service:
            raise ValueError("Retriever service not registered in orchestrator")
        
        retriever_payload = {
            "embedding": embedding_vector,
            "query": query,
            "top_k": request_data.get("top_k", 20),
            "filters": request_data.get("filters", {})
        }
        retrieved_chunks = await retriever_service.call(retriever_payload)

        # Execute Reranker if present and enabled
        reranker_service = self.services.get("reranker")
        reranked_chunks = retrieved_chunks
        if reranker_service and request_data.get("use_reranker", True):
            # Format payload for HuggingFace TEI reranker
            # TEI Reranker endpoint: /rerank
            # Payload: {"query": "...", "texts": ["...", "..."]}
            texts = [c["text"] for c in retrieved_chunks]
            if texts:
                rerank_res = await reranker_service.call({
                    "query": query,
                    "texts": texts
                })
                # TEI rerank response is a list of dicts: [{"index": i, "score": s}, ...] sorted or unsorted
                # Sort by score descending and take top 5
                sorted_results = sorted(rerank_res, key=lambda x: x["score"], reverse=True)
                top_5_indices = [item["index"] for item in sorted_results[:5]]
                reranked_chunks = [retrieved_chunks[idx] for idx in top_5_indices]
        else:
            # Fallback/Lite mode: just take top 5 from retrieval
            reranked_chunks = retrieved_chunks[:5]

        # Execute LLM
        llm_service = self.services.get("llm")
        if not llm_service:
            raise ValueError("LLM service not registered in orchestrator")

        # Format context for LLM prompt
        context_str = ""
        citations = []
        for idx, chunk in enumerate(reranked_chunks):
            doc_id = chunk.get("metadata", {}).get("source", "unknown")
            chunk_id = chunk.get("metadata", {}).get("chunk_id", f"chunk_{idx}")
            context_str += f"[Citation ID: {doc_id}#{chunk_id}]\n{chunk['text']}\n\n"
            citations.append({
                "citation_id": f"{doc_id}#{chunk_id}",
                "source": doc_id,
                "chunk_id": chunk_id,
                "text": chunk["text"]
            })

        # Render complete LLM prompt
        system_prompt = request_data.get("system_prompt", "You are an expert Network Operations Copilot.")
        user_prompt = f"{request_data.get('prompt_template', '')}\n\nContext:\n{context_str}\n\nQuery: {query}"

        llm_payload = {
            "model": "qwen",
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            "temperature": request_data.get("temperature", 0.1),
            "max_tokens": request_data.get("max_tokens", 1024)
        }

        llm_res = await llm_service.call(llm_payload)
        
        return {
            "answer": llm_res.get("choices", [{}])[0].get("message", {}).get("content", ""),
            "citations": citations
        }
