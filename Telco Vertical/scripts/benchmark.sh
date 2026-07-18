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

# Find virtual environment python
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

echo "Starting FleetMind Gateway Benchmarks..."
if [ -f "$PROJECT_ROOT/.venv/bin/python" ]; then
    "$PROJECT_ROOT/.venv/bin/python" "$SCRIPT_DIR/benchmark.py"
elif [ -f "$PROJECT_ROOT/.venv/Scripts/python.exe" ]; then
    "$PROJECT_ROOT/.venv/Scripts/python.exe" "$SCRIPT_DIR/benchmark.py"
else
    echo "Virtual environment python not found. Falling back to system python..."
    python3 "$SCRIPT_DIR/benchmark.py" || python "$SCRIPT_DIR/benchmark.py"
fi
