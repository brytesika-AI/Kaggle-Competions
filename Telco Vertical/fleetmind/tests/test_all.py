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
import shutil
import pytest
from fleetmind.synthgen.generator import generate_telemetry
from fleetmind.dataprep.parser import parse_and_cluster_logs
from fleetmind.chains.rca import validate_json_schema, RCA_SCHEMA

TEST_DIR_1 = "data/test_run_1"
TEST_DIR_2 = "data/test_run_2"

@pytest.fixture(autouse=True)
def cleanup():
    # Setup test directories
    yield
    # Clean up test directories
    for p in [TEST_DIR_1, TEST_DIR_2]:
        if os.path.exists(p):
            shutil.rmtree(p)

def test_generator_determinism():
    """Verify that generating telemetry with the same seed results in identical files."""
    # Run 1
    generate_telemetry(devices_count=50, days=2, seed=42, out_dir=TEST_DIR_1)
    # Run 2
    generate_telemetry(devices_count=50, days=2, seed=42, out_dir=TEST_DIR_2)
    
    # Check that both folders contain same files
    files1 = sorted(os.listdir(TEST_DIR_1))
    files2 = sorted(os.listdir(TEST_DIR_2))
    assert files1 == files2
    
    for f in files1:
        p1 = os.path.join(TEST_DIR_1, f)
        p2 = os.path.join(TEST_DIR_2, f)
        
        with open(p1, "r") as fh1, open(p2, "r") as fh2:
            assert fh1.read() == fh2.read()

def test_log_parser_clustering():
    """Verify that the parser clusters telemetry log anomalies correctly."""
    generate_telemetry(devices_count=100, days=3, seed=42, out_dir=TEST_DIR_1)
    
    log_files = [
        os.path.join(TEST_DIR_1, f) for f in os.listdir(TEST_DIR_1) if f.endswith(".jsonl")
    ]
    
    clusters = parse_and_cluster_logs(log_files)
    
    assert isinstance(clusters, list)
    if len(clusters) > 0:
        c = clusters[0]
        assert "text" in c
        assert "metadata" in c
        meta = c["metadata"]
        assert "error_code" in meta
        assert "device_model" in meta
        assert "firmware" in meta
        assert "region" in meta

def test_rca_json_schema_validation():
    """Verify that correct and incorrect JSON reports pass/fail validation."""
    valid_report = {
        "incident_title": "Tuner Lock Cascade Alert",
        "symptom_summary": "Tuner unlocks observed in low-SNR areas.",
        "affected_population": {
            "device_count": 12,
            "percentage": 0.05,
            "regions": ["ZA-NC"],
            "models": ["Kestrel-1"]
        },
        "probable_causes": [
            {
                "cause": "Tuner driver firmware regression under low SNR.",
                "confidence": "high",
                "evidence": ["tuner_lock_ref.md"]
            }
        ],
        "recommended_actions": ["Rollback firmware to v1.4.1."],
        "open_questions": ["Are other models affected?"]
    }
    
    invalid_report = {
        "incident_title": "Missing fields",
        "symptom_summary": "This should fail because it misses required properties."
    }
    
    assert validate_json_schema(valid_report, RCA_SCHEMA) is True
    assert validate_json_schema(invalid_report, RCA_SCHEMA) is False
