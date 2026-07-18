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
from typing import Dict, Any, Optional
from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, HTMLResponse
from pydantic import BaseModel

from fleetmind.chains.chat import run_chat_flow
from fleetmind.chains.rca import run_rca_flow
from fleetmind.chains.brief import run_brief_flow
from fleetmind.dataprep.ingest import init_index, ingest_kb_directory, ingest_telemetry_logs, get_redis_client, get_embedding

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s [%(levelname)s] %(name)s: %(message)s')
logger = logging.getLogger("fleetmind.gateway")

app = FastAPI(title="FleetMind Gateway", version="1.0.0")

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic Schemas
class ChatRequest(BaseModel):
    query: str
    filters: Optional[Dict[str, Any]] = None
    use_reranker: Optional[bool] = True

class RcaRequest(BaseModel):
    start_ts: str
    end_ts: str
    filters: Optional[Dict[str, Any]] = None

class BriefRequest(BaseModel):
    rca_data: Optional[Dict[str, Any]] = None
    start_ts: Optional[str] = None
    end_ts: Optional[str] = None
    filters: Optional[Dict[str, Any]] = None

class IngestRequest(BaseModel):
    type: str # "kb" or "telemetry" or "all"
    path: Optional[str] = None

# Initialize search index on startup
@app.on_event("startup")
async def startup_event():
    logger.info("Initializing vector search index...")
    try:
        init_index()
    except Exception as e:
        logger.error(f"Failed to initialize search index: {e}")

# API Routes
@app.post("/v1/chat")
async def chat_endpoint(req: ChatRequest):
    try:
        result = await run_chat_flow(
            query=req.query,
            filters=req.filters,
            use_reranker=req.use_reranker
        )
        return result
    except Exception as e:
        logger.exception("Error in chat endpoint")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/v1/rca")
async def rca_endpoint(req: RcaRequest):
    try:
        result = await run_rca_flow(
            start_ts=req.start_ts,
            end_ts=req.end_ts,
            filters=req.filters
        )
        return result
    except Exception as e:
        logger.exception("Error in rca endpoint")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/v1/brief")
async def brief_endpoint(req: BriefRequest):
    try:
        if req.rca_data:
            rca_data = req.rca_data
        elif req.start_ts and req.end_ts:
            rca_data = await run_rca_flow(
                start_ts=req.start_ts,
                end_ts=req.end_ts,
                filters=req.filters
            )
        else:
            raise HTTPException(status_code=400, detail="Provide either rca_data or start_ts and end_ts")
            
        brief_text = await run_brief_flow(rca_data)
        return {"brief": brief_text, "rca_data": rca_data}
    except Exception as e:
        logger.exception("Error in brief endpoint")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/v1/ingest")
async def ingest_endpoint(req: IngestRequest, background_tasks: BackgroundTasks):
    try:
        if req.type == "kb":
            kb_dir = req.path or "data/kb"
            background_tasks.add_task(ingest_kb_directory, kb_dir)
            return {"status": "ingestion_triggered", "type": "kb", "directory": kb_dir}
        elif req.type == "telemetry":
            telemetry_dir = req.path or "data/telemetry"
            log_files = glob.glob(os.path.join(telemetry_dir, "telemetry_*.jsonl"))
            background_tasks.add_task(ingest_telemetry_logs, log_files)
            return {"status": "ingestion_triggered", "type": "telemetry", "files_found": len(log_files)}
        elif req.type == "all":
            kb_dir = "data/kb"
            telemetry_dir = "data/telemetry"
            log_files = glob.glob(os.path.join(telemetry_dir, "telemetry_*.jsonl"))
            
            background_tasks.add_task(ingest_kb_directory, kb_dir)
            background_tasks.add_task(ingest_telemetry_logs, log_files)
            return {
                "status": "ingestion_triggered", 
                "type": "all", 
                "kb_dir": kb_dir, 
                "telemetry_files_found": len(log_files)
            }
        else:
            raise HTTPException(status_code=400, detail="Invalid ingest type")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/v1/health")
async def health_endpoint():
    status = {"status": "healthy", "redis": "down", "embedding": "down", "llm": "down"}
    
    # Check Redis
    try:
        r = get_redis_client()
        r.ping()
        status["redis"] = "up"
    except Exception:
        pass
        
    # Check Embedding
    try:
        # Generate dummy embedding
        get_embedding("healthcheck")
        status["embedding"] = "up"
    except Exception:
        pass
        
    # Check LLM
    try:
        llm_host = os.getenv("LLM_HOST", "localhost")
        llm_port = int(os.getenv("LLM_PORT", 8000))
        import httpx
        # We can ping the health endpoint or model endpoint
        # llama.cpp server uses /health, OpenVINO might vary
        res = httpx.get(f"http://{llm_host}:{llm_port}/health", timeout=2.0)
        if res.status_code == 200:
            status["llm"] = "up"
    except Exception:
        pass
        
    # Overall health
    if status["redis"] == "down" or status["embedding"] == "down" or status["llm"] == "down":
        status["status"] = "degraded"
        
    return status

# Fallback index.html with a stunning CSS dashboard
FALLBACK_HTML = """<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>FleetMind — OPEA GenAI NetOps Copilot</title>
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;800&family=Space+Grotesk:wght@400;600;700&display=swap" rel="stylesheet">
    <script src="https://cdn.jsdelivr.net/npm/lucide@latest"></script>
    <style>
        :root {
            --bg-dark: #0f111a;
            --bg-card: rgba(22, 28, 45, 0.7);
            --bg-nav: #090b11;
            --primary: #3b82f6;
            --primary-glow: rgba(59, 130, 246, 0.4);
            --accent: #10b981;
            --text-main: #f3f4f6;
            --text-muted: #9ca3af;
            --border: rgba(255, 255, 255, 0.08);
        }
        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }
        body {
            background-color: var(--bg-dark);
            color: var(--text-main);
            font-family: 'Outfit', sans-serif;
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            overflow-x: hidden;
        }
        h1, h2, h3, h4 {
            font-family: 'Space Grotesk', sans-serif;
            font-weight: 700;
        }
        /* Top Navigation */
        header {
            background-color: var(--bg-nav);
            border-bottom: 1px solid var(--border);
            padding: 1rem 2rem;
            display: flex;
            justify-content: space-between;
            align-items: center;
            position: sticky;
            top: 0;
            z-index: 100;
            backdrop-filter: blur(10px);
        }
        .logo-container {
            display: flex;
            align-items: center;
            gap: 0.75rem;
        }
        .logo-text {
            font-size: 1.5rem;
            background: linear-gradient(135deg, #60a5fa, #3b82f6);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            letter-spacing: -0.5px;
        }
        .status-pill {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            font-size: 0.85rem;
            padding: 0.25rem 0.75rem;
            border-radius: 9999px;
            background-color: rgba(16, 185, 129, 0.1);
            border: 1px solid rgba(16, 185, 129, 0.2);
            color: var(--accent);
        }
        /* Tab bar */
        .tabs {
            display: flex;
            gap: 1rem;
        }
        .tab-btn {
            background: none;
            border: none;
            color: var(--text-muted);
            font-family: inherit;
            font-size: 1rem;
            font-weight: 600;
            padding: 0.5rem 1rem;
            cursor: pointer;
            border-radius: 0.5rem;
            transition: all 0.3s ease;
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }
        .tab-btn.active {
            color: var(--text-main);
            background-color: rgba(255, 255, 255, 0.05);
            box-shadow: inset 0 0 0 1px var(--border);
        }
        .tab-btn:hover {
            color: var(--text-main);
        }
        /* Main Layout */
        main {
            flex: 1;
            display: flex;
            padding: 2rem;
            gap: 2rem;
            max-width: 1600px;
            margin: 0 auto;
            width: 100%;
        }
        .content-panel {
            flex: 3;
            background: var(--bg-card);
            border: 1px solid var(--border);
            border-radius: 1rem;
            backdrop-filter: blur(16px);
            display: flex;
            flex-direction: column;
            height: calc(100vh - 12rem);
            overflow: hidden;
            box-shadow: 0 10px 30px rgba(0,0,0,0.5);
        }
        .side-panel {
            flex: 1.2;
            background: var(--bg-card);
            border: 1px solid var(--border);
            border-radius: 1rem;
            backdrop-filter: blur(16px);
            padding: 1.5rem;
            height: calc(100vh - 12rem);
            overflow-y: auto;
            box-shadow: 0 10px 30px rgba(0,0,0,0.5);
            display: flex;
            flex-direction: column;
            gap: 1.5rem;
        }
        /* Chat View */
        .chat-container {
            display: flex;
            flex-direction: column;
            height: 100%;
        }
        .messages-list {
            flex: 1;
            padding: 1.5rem;
            overflow-y: auto;
            display: flex;
            flex-direction: column;
            gap: 1rem;
        }
        .msg {
            max-width: 80%;
            padding: 1rem;
            border-radius: 0.75rem;
            line-height: 1.5;
            font-size: 0.95rem;
            animation: fadeIn 0.3s ease forwards;
        }
        .msg.user {
            align-self: flex-end;
            background-color: var(--primary);
            color: #fff;
        }
        .msg.assistant {
            align-self: flex-start;
            background-color: rgba(255, 255, 255, 0.03);
            border: 1px solid var(--border);
        }
        .msg.system {
            align-self: center;
            background-color: rgba(239, 68, 68, 0.1);
            border: 1px solid rgba(239, 68, 68, 0.2);
            color: #f87171;
            font-size: 0.85rem;
            max-width: 100%;
        }
        .input-bar {
            padding: 1rem 1.5rem;
            border-top: 1px solid var(--border);
            display: flex;
            gap: 1rem;
            background-color: rgba(9, 11, 17, 0.5);
        }
        .chat-input {
            flex: 1;
            background-color: rgba(255,255,255,0.05);
            border: 1px solid var(--border);
            color: var(--text-main);
            padding: 0.75rem 1rem;
            border-radius: 0.5rem;
            font-family: inherit;
            font-size: 0.95rem;
            outline: none;
            transition: border-color 0.3s;
        }
        .chat-input:focus {
            border-color: var(--primary);
        }
        .btn {
            background-color: var(--primary);
            color: white;
            border: none;
            padding: 0.75rem 1.5rem;
            border-radius: 0.5rem;
            font-family: inherit;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s;
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }
        .btn:hover {
            box-shadow: 0 0 15px var(--primary-glow);
            transform: translateY(-1px);
        }
        /* RCA View */
        .rca-container {
            display: flex;
            flex-direction: column;
            height: 100%;
            padding: 1.5rem;
            overflow-y: auto;
        }
        .form-row {
            display: flex;
            gap: 1rem;
            margin-bottom: 1.5rem;
            align-items: flex-end;
        }
        .form-group {
            flex: 1;
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
        }
        .form-group label {
            font-size: 0.85rem;
            color: var(--text-muted);
            text-transform: uppercase;
            letter-spacing: 1px;
            font-weight: 600;
        }
        .select-input, .date-input {
            background-color: rgba(255,255,255,0.05);
            border: 1px solid var(--border);
            color: var(--text-main);
            padding: 0.75rem;
            border-radius: 0.5rem;
            outline: none;
            font-family: inherit;
        }
        /* Citations Panel */
        .citation-item {
            background-color: rgba(255,255,255,0.02);
            border: 1px solid var(--border);
            border-radius: 0.5rem;
            padding: 0.75rem;
            cursor: pointer;
            transition: all 0.3s;
        }
        .citation-item:hover {
            background-color: rgba(255,255,255,0.05);
            border-color: var(--primary);
        }
        .citation-header {
            font-size: 0.85rem;
            font-weight: 600;
            color: var(--primary);
            margin-bottom: 0.25rem;
            display: flex;
            justify-content: space-between;
        }
        .citation-text {
            font-size: 0.8rem;
            color: var(--text-muted);
            line-height: 1.4;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
        }
        /* Animations */
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(5px); }
            to { opacity: 1; transform: translateY(0); }
        }
        /* JSON Renderer */
        .json-block {
            background-color: rgba(0,0,0,0.3);
            border: 1px solid var(--border);
            border-radius: 0.5rem;
            padding: 1rem;
            font-family: monospace;
            font-size: 0.85rem;
            overflow-x: auto;
            color: #34d399;
            margin-top: 1rem;
        }
        .brief-block {
            background: linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(16, 185, 129, 0.1));
            border: 1px solid rgba(59, 130, 246, 0.2);
            border-radius: 0.5rem;
            padding: 1.5rem;
            margin-top: 1rem;
            line-height: 1.6;
            font-size: 0.95rem;
        }
    </style>
</head>
<body>
    <header>
        <div class="logo-container">
            <i data-lucide="cpu" style="color:#3b82f6;"></i>
            <span class="logo-text">FleetMind</span>
            <span style="font-size:0.8rem;color:var(--text-muted);margin-left:0.5rem;">OPEA NetOps Copilot</span>
        </div>
        <div class="tabs">
            <button class="tab-btn active" onclick="switchTab('chat')">
                <i data-lucide="message-square"></i> Fleet Q&A
            </button>
            <button class="tab-btn" onclick="switchTab('rca')">
                <i data-lucide="file-text"></i> RCA Draft
            </button>
            <button class="tab-btn" onclick="switchTab('brief')">
                <i data-lucide="bookmark"></i> Executive Brief
            </button>
        </div>
        <div class="status-pill">
            <span style="width: 8px; height: 8px; border-radius: 50%; background-color: var(--accent);"></span>
            System Online
        </div>
    </header>

    <main>
        <!-- Chat Tab View -->
        <section id="chat-tab" class="content-panel">
            <div class="chat-container">
                <div class="messages-list" id="chat-messages">
                    <div class="msg assistant">
                        Hello operations engineer! I am FleetMind. I have indexed your troubleshooting knowledge base and telemetry log summaries. Ask me any Q&A question or query device status.
                    </div>
                </div>
                <div class="input-bar">
                    <input type="text" class="chat-input" id="chat-input-text" placeholder="Ask about firmware errors, secure Element read storms, signal SNR baselines...">
                    <button class="btn" onclick="sendChatMessage()">
                        Send <i data-lucide="send" style="width:16px;"></i>
                    </button>
                </div>
            </div>
        </section>

        <!-- RCA Tab View -->
        <section id="rca-tab" class="content-panel" style="display:none;">
            <div class="rca-container">
                <div class="form-row">
                    <div class="form-group">
                        <label>Start Timestamp</label>
                        <input type="text" class="date-input" id="rca-start" value="2026-07-01T00:00:00">
                    </div>
                    <div class="form-group">
                        <label>End Timestamp</label>
                        <input type="text" class="date-input" id="rca-end" value="2026-07-05T23:59:59">
                    </div>
                    <div class="form-group">
                        <label>Device Model Filter</label>
                        <select class="select-input" id="rca-model">
                            <option value="">All Models</option>
                            <option value="Kestrel-1">Kestrel-1</option>
                            <option value="Kestrel-2">Kestrel-2</option>
                            <option value="Ibis-4K">Ibis-4K</option>
                            <option value="Weaver-Lite">Weaver-Lite</option>
                        </select>
                    </div>
                    <button class="btn" onclick="generateRcaDraft()">
                        Generate RCA <i data-lucide="play" style="width:16px;"></i>
                    </button>
                </div>
                <div id="rca-result-area" style="display:none;">
                    <h3>Root Cause Analysis Draft</h3>
                    <div class="json-block" id="rca-json-output"></div>
                </div>
            </div>
        </section>

        <!-- Executive Brief Tab View -->
        <section id="brief-tab" class="content-panel" style="display:none;">
            <div class="rca-container">
                <div class="form-row">
                    <div class="form-group">
                        <label>Start Timestamp</label>
                        <input type="text" class="date-input" id="brief-start" value="2026-07-01T00:00:00">
                    </div>
                    <div class="form-group">
                        <label>End Timestamp</label>
                        <input type="text" class="date-input" id="brief-end" value="2026-07-05T23:59:59">
                    </div>
                    <button class="btn" onclick="generateExecutiveBrief()">
                        Generate Brief <i data-lucide="sparkles" style="width:16px;"></i>
                    </button>
                </div>
                <div id="brief-result-area" style="display:none;">
                    <h3>Plain-English Executive Briefing</h3>
                    <div class="brief-block" id="brief-text-output"></div>
                </div>
            </div>
        </section>

        <!-- Sidebar (Citations & Reference Panel) -->
        <aside class="side-panel">
            <h3>Reference Context</h3>
            <p style="font-size:0.85rem;color:var(--text-muted);">Citations used in current session grounding will appear below.</p>
            <div id="citations-list" style="display:flex;flex-direction:column;gap:0.75rem;">
                <div style="font-size:0.85rem;color:var(--text-muted);text-align:center;padding-top:2rem;">No citations yet</div>
            </div>
        </aside>
    </main>

    <script>
        // Init Lucide
        lucide.createIcons();

        function switchTab(tabId) {
            document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
            document.getElementById('chat-tab').style.display = 'none';
            document.getElementById('rca-tab').style.display = 'none';
            document.getElementById('brief-tab').style.display = 'none';

            if (tabId === 'chat') {
                document.getElementById('chat-tab').style.display = 'flex';
                event.currentTarget.classList.add('active');
            } else if (tabId === 'rca') {
                document.getElementById('rca-tab').style.display = 'flex';
                event.currentTarget.classList.add('active');
            } else if (tabId === 'brief') {
                document.getElementById('brief-tab').style.display = 'flex';
                event.currentTarget.classList.add('active');
            }
        }

        async def_api(endpoint, payload) {
            const res = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            return await res.json();
        }

        async function sendChatMessage() {
            const input = document.getElementById('chat-input-text');
            const query = input.value.strip ? input.value.trim() : input.value;
            if (!query) return;

            const chatMessages = document.getElementById('chat-messages');
            chatMessages.innerHTML += `<div class="msg user">${query}</div>`;
            input.value = '';

            try {
                const res = await def_api('/v1/chat', { query: query });
                const answer = res.answer || "No response received";
                chatMessages.innerHTML += `<div class="msg assistant">${answer}</div>`;
                
                // Load citations
                const citationsList = document.getElementById('citations-list');
                if (res.citations && res.citations.length > 0) {
                    citationsList.innerHTML = '';
                    res.citations.forEach(c => {
                        citationsList.innerHTML += `
                            <div class="citation-item">
                                <div class="citation-header">
                                    <span>${c.source}</span>
                                    <span>${c.chunk_id}</span>
                                </div>
                                <div class="citation-text">${c.text}</div>
                            </div>
                        `;
                    });
                }
            } catch (err) {
                chatMessages.innerHTML += `<div class="msg system">Error sending request: ${err.message}</div>`;
            }
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }

        async function generateRcaDraft() {
            const start = document.getElementById('rca-start').value;
            const end = document.getElementById('rca-end').value;
            const model = document.getElementById('rca-model').value;
            const output = document.getElementById('rca-json-output');
            
            output.innerText = "Loading and running statistical anomaly clustering...";
            document.getElementById('rca-result-area').style.display = 'block';

            try {
                const res = await def_api('/v1/rca', {
                    start_ts: start,
                    end_ts: end,
                    filters: model ? { device_model: model } : {}
                });
                output.innerText = JSON.stringify(res, null, 2);
            } catch (err) {
                output.innerText = "Error: " + err.message;
            }
        }

        async function generateExecutiveBrief() {
            const start = document.getElementById('brief-start').value;
            const end = document.getElementById('brief-end').value;
            const output = document.getElementById('brief-text-output');
            
            output.innerText = "Analyzing anomalies and composing summary...";
            document.getElementById('brief-result-area').style.display = 'block';

            try {
                const res = await def_api('/v1/brief', {
                    start_ts: start,
                    end_ts: end
                });
                output.innerText = res.brief || "No brief generated";
            } catch (err) {
                output.innerText = "Error: " + err.message;
            }
        }
    </script>
</body>
</html>
"""

# Serve Fallback UI directly on root if static folder not present
@app.get("/", response_class=HTMLResponse)
async def serve_root():
    static_index = os.path.join("ui", "dist", "index.html")
    if os.path.exists(static_index):
        return FileResponse(static_index)
    return HTMLResponse(content=FALLBACK_HTML)

# Mount static build folder of UI
if os.path.exists(os.path.join("ui", "dist")):
    app.mount("/static", StaticFiles(directory=os.path.join("ui", "dist")), name="static")
