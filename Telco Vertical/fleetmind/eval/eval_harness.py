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
import json
import logging

from fleetmind.synthgen.generator import generate_telemetry
from fleetmind.dataprep.parser import parse_and_cluster_logs
from fleetmind.chains.rca import run_rca_flow

logger = logging.getLogger("fleetmind.eval")

def evaluate_offline(telemetry_dir: str) -> float:
    """Runs a rule-based evaluation against ground truth to measure diagnostic accuracy."""
    print("Running offline evaluation...")
    with open(os.path.join(telemetry_dir, "ground_truth.json"), "r") as f:
        ground_truth = json.load(f)
        
    log_files = [os.path.join(telemetry_dir, f) for f in os.listdir(telemetry_dir) if f.endswith(".jsonl")]
    clusters = parse_and_cluster_logs(log_files)
    
    hits = 0
    total = len(ground_truth)
    
    # Map error codes to scenario names
    code_to_scenario = {
        "TUN-E1042": "tuner_lock_cascade",
        "CLK-E0007": "epoch_reset_ota",
        "SEC-E0311": "otp_read_storm",
        "OTA-E0550": "ota_partial_brick",
        "WDT-E0100": "memory_leak_slowburn"
    }
    
    detected_scenarios = set()
    for c in clusters:
        code = c["metadata"].get("error_code")
        if code in code_to_scenario:
            detected_scenarios.add(code_to_scenario[code])
            
    for gt in ground_truth:
        scenario = gt["scenario"]
        if scenario in detected_scenarios:
            print(f"  [PASS] Scenario '{scenario}' correctly identified in log clusters.")
            hits += 1
        else:
            print(f"  [FAIL] Scenario '{scenario}' was NOT identified in log clusters.")
            
    hit_rate = hits / total if total > 0 else 0.0
    print(f"Offline Evaluation Hit-rate: {hits}/{total} ({hit_rate:.1%})")
    return hit_rate

async def evaluate_online(telemetry_dir: str) -> float:
    """Runs actual RAG + LLM RCA flow for 10 distinct windows to evaluate quality."""
    print("Running online evaluation (requires LLM service running)...")
    
    # Define 10 test windows (start, end, expected_scenario)
    # The scenarios are active in different days of our simulation starting 2026-07-01
    test_cases = [
        {"start": "2026-07-01T00:00:00", "end": "2026-07-02T23:59:59", "expected": "TUN-E1042"},
        {"start": "2026-07-03T00:00:00", "end": "2026-07-04T23:59:59", "expected": "CLK-E0007"},
        {"start": "2026-07-01T12:00:00", "end": "2026-07-03T12:00:00", "expected": "SEC-E0311"},
        {"start": "2026-07-05T00:00:00", "end": "2026-07-06T23:59:59", "expected": "OTA-E0550"},
        {"start": "2026-07-09T00:00:00", "end": "2026-07-11T23:59:59", "expected": "WDT-E0100"},
        {"start": "2026-07-02T00:00:00", "end": "2026-07-03T23:59:59", "expected": "TUN-E1042"},
        {"start": "2026-07-04T00:00:00", "end": "2026-07-05T23:59:59", "expected": "CLK-E0007"},
        {"start": "2026-07-02T12:00:00", "end": "2026-07-04T12:00:00", "expected": "SEC-E0311"},
        {"start": "2026-07-06T00:00:00", "end": "2026-07-07T23:59:59", "expected": "OTA-E0550"},
        {"start": "2026-07-11T00:00:00", "end": "2026-07-13T23:59:59", "expected": "WDT-E0100"}
    ]
    
    hits = 0
    total = len(test_cases)
    
    for idx, tc in enumerate(test_cases):
        print(f"Testing incident {idx+1}/{total} (Window: {tc['start']} to {tc['end']})...")
        try:
            rca_res = await run_rca_flow(tc["start"], tc["end"], telemetry_dir=telemetry_dir)
            # Check if expected error code is mentioned in probable causes or symptoms
            rca_str = json.dumps(rca_res).lower()
            expected_code = tc["expected"].lower()
            
            if expected_code in rca_str:
                print(f"  [PASS] Expected code '{tc['expected']}' was identified in LLM RCA.")
                hits += 1
            else:
                print(f"  [FAIL] Expected code '{tc['expected']}' was NOT found in LLM RCA.")
        except Exception as e:
            print(f"  [ERROR] Running RCA failed: {e}")
            
    hit_rate = hits / total if total > 0 else 0.0
    print(f"Online LLM Evaluation Hit-rate: {hits}/{total} ({hit_rate:.1%})")
    return hit_rate

async def run_eval():
    eval_dir = "data/eval_telemetry"
    if os.path.exists(eval_dir):
        import shutil
        shutil.rmtree(eval_dir)
        
    print("Generating evaluation telemetry...")
    # Generate a deterministic evaluation telemetry set
    generate_telemetry(devices_count=200, days=14, seed=123, out_dir=eval_dir)
    
    # 1. Run offline rule-based check
    offline_rate = evaluate_offline(eval_dir)
    
    # 2. Run online check if LLM is online
    import httpx
    llm_online = False
    llm_host = os.getenv("LLM_HOST", "localhost")
    llm_port = int(os.getenv("LLM_PORT", 8000))
    try:
        res = httpx.get(f"http://{llm_host}:{llm_port}/health", timeout=2.0)
        if res.status_code == 200:
            llm_online = True
    except Exception:
        pass
        
    if llm_online:
        online_rate = await evaluate_online(eval_dir)
        print(f"Evaluation Complete. Offline Hit-Rate: {offline_rate:.1%}, Online Hit-Rate: {online_rate:.1%}")
    else:
        print("LLM server offline. Skipping online RAG evaluation.")
        print(f"Evaluation Complete. Offline Hit-Rate: {offline_rate:.1%}")
        
    # Clean up
    if os.path.exists(eval_dir):
        import shutil
        shutil.rmtree(eval_dir)

if __name__ == "__main__":
    import asyncio
    asyncio.run(run_eval())
