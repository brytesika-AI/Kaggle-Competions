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
echo "          FleetMind Preflight Checks        "
echo "============================================"

# 1. Check OS (Must be Linux for deployment target, but print warning if other)
UNAME_OUT="$(uname -s)"
case "${UNAME_OUT}" in
    Linux*)     machine=MinGW;;
    *)          echo "WARNING: Detected non-Linux environment ($UNAME_OUT). System is optimized for Linux Ubuntu 22.04/24.04."
esac

# 2. Check RAM
if [ -f /proc/meminfo ]; then
    TOTAL_KB=$(grep MemTotal /proc/meminfo | awk '{print $2}')
    TOTAL_GB=$((TOTAL_KB / 1024 / 1024))
    echo "Memory detected: ${TOTAL_GB} GB"
    if [ "$TOTAL_GB" -lt 8 ]; then
        echo "ERROR: Insufficient RAM. FleetMind requires at least 8GB RAM (64GB recommended)."
        exit 1
    elif [ "$TOTAL_GB" -lt 32 ]; then
        echo "WARNING: FleetMind runs best with at least 32GB/64GB RAM. Running on ${TOTAL_GB}GB might result in slow LLM responses."
    fi
else
    echo "WARNING: Could not determine total memory (/proc/meminfo not found)."
fi

# 3. Check CPU cores
if command -v nproc >/dev/null 2>&1; then
    CORES=$(nproc)
    echo "CPU Cores detected: ${CORES}"
    if [ "$CORES" -lt 4 ]; then
        echo "WARNING: Less than 4 CPU cores detected. CPU-based inference might be slow."
    fi
else
    echo "WARNING: Could not determine CPU cores count."
fi

# 4. Check Disk Space
if command -v df >/dev/null 2>&1; then
    FREE_KB=$(df -k . | awk 'NR==2 {print $4}')
    FREE_GB=$((FREE_KB / 1024 / 1024))
    echo "Free Disk Space: ${FREE_GB} GB"
    if [ "$FREE_GB" -lt 10 ]; then
        echo "ERROR: Insufficient disk space. FleetMind requires at least 10GB of free space to download models and images."
        exit 1
    fi
else
    echo "WARNING: Could not determine free disk space."
fi

# 5. Check Docker
if command -v docker >/dev/null 2>&1; then
    echo "Docker is installed: $(docker --version)"
    if ! docker ps >/dev/null 2>&1; then
        echo "ERROR: Docker daemon is not running or the current user does not have permission."
        exit 1
    fi
else
    echo "ERROR: Docker is not installed. Please install Docker first."
    exit 1
fi

# 6. Check Docker Compose
if docker compose version >/dev/null 2>&1; then
    echo "Docker Compose is installed: $(docker compose version)"
elif command -v docker-compose >/dev/null 2>&1; then
    echo "Docker Compose (legacy) is installed: $(docker-compose --version)"
else
    echo "ERROR: Docker Compose is not installed. Please install docker-compose-plugin."
    exit 1
fi

echo "Preflight checks passed successfully!"
echo "============================================"
exit 0
