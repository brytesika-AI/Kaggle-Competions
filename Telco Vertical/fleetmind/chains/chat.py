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
import logging
from typing import Dict, Any

from fleetmind.gateway.orchestrator import ServiceOrchestrator, MicroService, ServiceType
from fleetmind.dataprep.ingest import query_vector_index

logger = logging.getLogger("fleetmind.chains.chat")

# Load chat prompt from prompts directory
PROMPT_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "prompts", "chat.txt")

def load_chat_prompt() -> str:
    with open(PROMPT_PATH, "r", encoding="utf-8") as f:
        return f.read()

# Setup OPEA Retriever microservice locally in python to run inside the orchestrator flow
class RedisRetrieverService(MicroService):
    def __init__(self):
        super().__init__(
            name="retriever",
            host="localhost", # dummy since we override call
            port=0,
            endpoint="",
            service_type=ServiceType.RETRIEVER,
            use_remote_service=False
        )

    async def call(self, payload: Dict[str, Any]) -> Any:
        query = payload.get("query", "")
        top_k = payload.get("top_k", 20)
        filters = payload.get("filters", {})
        # Perform query in vector index
        return query_vector_index(query, top_k=top_k, filters=filters)

async def run_chat_flow(query: str, filters: Dict[str, Any] = None, use_reranker: bool = True) -> Dict[str, Any]:
    """
    Executes the Fleet Q&A chat flow using the OPEA Megaservice orchestrator.
    """
    # Setup orchestrator
    orchestrator = ServiceOrchestrator()
    
    # Retrieve host/port configs from environment
    emb_host = os.getenv("EMBEDDING_HOST", "localhost")
    emb_port = int(os.getenv("EMBEDDING_PORT", 8080))
    
    rerank_host = os.getenv("RERANKER_HOST", "localhost")
    rerank_port = int(os.getenv("RERANKER_PORT", 8081))
    
    llm_host = os.getenv("LLM_HOST", "localhost")
    llm_port = int(os.getenv("LLM_PORT", 8000))
    # We map OpenAI / llama.cpp REST endpoints
    llm_endpoint = "/v1/chat/completions"
    
    # Register microservices
    embedding_service = MicroService(
        name="embedding",
        host=emb_host,
        port=emb_port,
        endpoint="/embed",
        service_type=ServiceType.EMBEDDING
    )
    
    retriever_service = RedisRetrieverService()
    
    reranker_service = MicroService(
        name="reranker",
        host=rerank_host,
        port=rerank_port,
        endpoint="/rerank",
        service_type=ServiceType.RERANKER
    )
    
    llm_service = MicroService(
        name="llm",
        host=llm_host,
        port=llm_port,
        endpoint=llm_endpoint,
        service_type=ServiceType.LLM
    )
    
    orchestrator.add(embedding_service).add(retriever_service).add(llm_service)
    
    # Only add reranker if it's not Lite mode
    if use_reranker:
        orchestrator.add(reranker_service)
        
    # Flow composition
    orchestrator.flow_to(embedding_service, retriever_service)
    if use_reranker:
        orchestrator.flow_to(retriever_service, reranker_service)
        orchestrator.flow_to(reranker_service, llm_service)
    else:
        orchestrator.flow_to(retriever_service, llm_service)
        
    # Build query request payload
    chat_prompt = load_chat_prompt()
    request_data = {
        "query": query,
        "top_k": 20,
        "filters": filters or {},
        "use_reranker": use_reranker,
        "system_prompt": "You are FleetMind, an expert AI network-operations copilot for emerging-market telecom operators. Support answers with citations.",
        "prompt_template": chat_prompt,
        "temperature": 0.1,
        "max_tokens": 1024
    }
    
    # ExecuteMegaservice schedule
    result = await orchestrator.schedule(request_data)
    return result
