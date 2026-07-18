#!/usr/bin/env bash
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

set -euo pipefail

echo "============================================"
echo "          FleetMind One-Click Deploy        "
echo "============================================"

# 1. Run Preflight checks
bash scripts/preflight.sh

# 2. Download Qwen2.5-3B-Instruct GGUF Model
MODEL_DIR="data/models"
MODEL_FILE="$MODEL_DIR/qwen2.5-3b-instruct-q4_k_m.gguf"
MODEL_URL="https://huggingface.co/Qwen/Qwen2.5-3B-Instruct-GGUF/resolve/main/qwen2.5-3b-instruct-q4_k_m.gguf"

mkdir -p "$MODEL_DIR"

if [ -f "$MODEL_FILE" ]; then
    echo "LLM Model file already exists. Skipping download."
else
    echo "Downloading Qwen2.5-3B-Instruct-Q4_K_M GGUF model (~1.9GB)..."
    echo "Assumed network bandwidth: 100 Mbps (expected download time: ~2.5 mins)"
    if command -v wget >/dev/null 2>&1; then
        wget -O "$MODEL_FILE" "$MODEL_URL"
    elif command -v curl >/dev/null 2>&1; then
        curl -L -o "$MODEL_FILE" "$MODEL_URL"
    else
        echo "ERROR: Neither wget nor curl found. Cannot download LLM model."
        exit 1
    fi
fi

# 3. Pull and start Docker services (Default profile includes reranker + llama.cpp)
echo "Starting Docker Compose services..."
docker compose --profile default pull
docker compose --profile default up -d

# 4. Wait for services to be healthy
echo "Waiting for FleetMind services to be healthy (this can take up to 2 minutes on first run)..."
MAX_ATTEMPTS=24 # 2 minutes (24 * 5s)
ATTEMPT=1
HEALTHY=0

while [ $ATTEMPT -le $MAX_ATTEMPTS ]; do
    echo "Checking gateway health (Attempt $ATTEMPT/$MAX_ATTEMPTS)..."
    if curl -s -f http://localhost:8888/v1/health >/dev/null 2>&1; then
        # Check if individual components are up
        STATUS=$(curl -s http://localhost:8888/v1/health)
        if [[ "$STATUS" == *"\"status\":\"healthy\""* ]]; then
            echo "All FleetMind services are ONLINE and HEALTHY!"
            HEALTHY=1
            break
        else
            echo "Gateway is up, but components are still initializing: $STATUS"
        fi
    fi
    sleep 5
    ATTEMPT=$((ATTEMPT + 1))
done

if [ $HEALTHY -ne 1 ]; then
    echo "ERROR: Timeout waiting for services to become healthy."
    echo "Current service status:"
    docker compose ps
    exit 1
fi

# 5. Trigger automated ingestion of KB articles and sample telemetry
echo "Triggering database ingestion..."
INGEST_RES=$(curl -s -X POST -H "Content-Type: application/json" -d '{"type":"all"}' http://localhost:8888/v1/ingest)
echo "Ingestion Response: $INGEST_RES"

# 6. Run Smoke Test
echo "Running quick smoke test query..."
SMOKE_RES=$(curl -s -X POST -H "Content-Type: application/json" -d '{"query":"What does CLK-E0007 mean?"}' http://localhost:8888/v1/chat)

if [[ "$SMOKE_RES" == *"answer"* ]]; then
    echo "Smoke test passed successfully!"
    echo "You can access the FleetMind UI in your browser at http://localhost:8888/"
else
    echo "WARNING: Smoke test returned unexpected response: $SMOKE_RES"
fi

echo "============================================"
echo "          Deployment Completed              "
echo "============================================"
exit 0
