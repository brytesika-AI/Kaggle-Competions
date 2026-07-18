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
echo "          FleetMind License Audit           "
echo "============================================"

# Ensure pip-licenses is installed
if ! command -v pip-licenses >/dev/null 2>&1; then
    echo "Installing pip-licenses..."
    python -m pip install -q pip-licenses
fi

# Run pip-licenses to check for forbidden licenses
echo "Running package license audit..."
FORBIDDEN_LICENSES="gpl|lgpl|agpl|gnu"

# We check both full list and check for forbidden strings in the license fields.
# pip-licenses --format=csv gives "Name","Version","License"
AUDIT_OUTPUT=$(pip-licenses --format=csv --ignore-packages pip setuptools pkg-resources wheels)

echo "Audited Packages:"
echo "$AUDIT_OUTPUT" | column -t -s ',' || echo "$AUDIT_OUTPUT"

# Perform case-insensitive check for forbidden licenses
VIOLATIONS=$(echo "$AUDIT_OUTPUT" | tr '[:upper:]' '[:lower:]' | grep -E "$FORBIDDEN_LICENSES" || true)

if [ -n "$VIOLATIONS" ]; then
    echo "ERROR: Forbidden licenses found (GPL/LGPL/AGPL/GNU):"
    echo "$VIOLATIONS"
    exit 1
else
    echo "Audit passed: Zero GPL/LGPL/AGPL packages detected."
    echo "============================================"
    exit 0
fi
