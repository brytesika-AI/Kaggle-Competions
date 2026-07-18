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

import json
import httpx

API_URL = "http://localhost:8888"

def print_header(title):
    print("\n" + "=" * 60)
    print(f" {title} ")
    print("=" * 60)

def run_mock_demo():
    print_header("DEMO MODE: Offline (Simulating API Responses)")
    
    # 1. Fleet Q&A
    print_header("FLOW 1: Fleet Q&A (Natural Language)")
    query = "What does Flag=1 mean for secure core read error SEC-E0311?"
    print(f"User Query: '{query}'\n")
    print("Sending request to /v1/chat...")
    print("Response:")
    print("  \"The secure core OTP memory read error SEC-E0311 with Flag=1 represents a critical ")
    print("  authentication or hardware integrity failure, which immediately revokes descrambling ")
    print("  keys and blocks channel decryption. This is in contrast to Flag=0, which indicates a ")
    print("  benign transient timeout where the system automatically retries.\"")
    print("\nCitations Grounding:")
    print("  [1] kb_secure_otp_ref.md#chunk_0: SEC-E0311: Flag=1 represents a critical secure core integrity failure...")
    print("  [2] kb_ibis4k_hardware_guide.md#chunk_1: SEC-E0311 is logged when a read error occurs. Flag=1 represents a...")

    # 2. RCA Draft
    print_header("FLOW 2: Root Cause Analysis Draft (JSON)")
    start = "2026-07-01T00:00:00"
    end = "2026-07-05T23:59:59"
    print(f"User Selection: Time Window from {start} to {end}\n")
    print("Sending request to /v1/rca...")
    print("Response (Validated JSON):")
    
    mock_rca = {
        "incident_title": "Kestrel-1 Tuner Lock Driver Cascading Failures",
        "symptom_summary": "Spike in TUN-E1042 tuner lock failures on Kestrel-1 decoders in the Northern Cape (ZA-NC) region.",
        "affected_population": {
            "device_count": 50,
            "percentage": 0.30,
            "regions": ["ZA-NC"],
            "models": ["Kestrel-1"]
        },
        "probable_causes": [
            {
                "cause": "Firmware driver bug in tuner lock retry handler combined with marginal LNB signal quality.",
                "confidence": "high",
                "evidence": [
                    "telemetry_2026-07-01#TUN-E1042",
                    "kb_tuner_lock_ref.md#chunk_0",
                    "kb_kestrel1_hardware_guide.md#chunk_1"
                ]
            }
        ],
        "recommended_actions": [
            "Roll back affected Kestrel-1 decoders in ZA-NC region from firmware v1.4.2 to stable v1.4.1.",
            "Deploy technicians to inspect regional LNB alignments where SNR is persistently below 9.0 dB."
        ],
        "open_questions": [
            "Are other firmware versions in ZA-NC experiencing similar signal degradation?"
        ]
    }
    print(json.dumps(mock_rca, indent=2))

    # 3. Executive Brief
    print_header("FLOW 3: Plain-English Executive Briefing")
    print("Sending request to /v1/brief...")
    print("Response (Jargon-free, <=300 words):")
    print("  \"SUMMARY OF INCIDENT: Over the past five days, approximately 30% of our Kestrel-1 ")
    print("  decoder fleet in the Northern Cape region experienced television viewing interruptions ")
    print("  and reboot loops. A total of 50 decoders were affected.")
    print("  ")
    print("  CURRENT STATUS: The technical operations team has diagnosed the issue as an incompatibility ")
    print("  between the latest software update (version 1.4.2) and local low-signal conditions. ")
    print("  ")
    print("  RECOMMENDED ACTIONS: We are rolling back the software on the 50 affected decoders to the ")
    print("  stable previous version (1.4.1). In addition, technicians are checking satellite dish ")
    print("  alignments in the affected area to improve signal strength.\"")
    
    print("\n" + "=" * 60)
    print(" Walkthrough finished successfully! ")
    print("=" * 60)

def run_live_demo():
    print_header("DEMO MODE: Live API Connection")
    client = httpx.Client(timeout=30.0)
    
    # 1. Chat
    print_header("FLOW 1: Fleet Q&A (Natural Language)")
    query = "What does Flag=1 mean for secure core read error SEC-E0311?"
    print(f"User Query: '{query}'\n")
    try:
        res = client.post(f"{API_URL}/v1/chat", json={"query": query})
        res.raise_for_status()
        data = res.json()
        print("Response:")
        print(data.get("answer"))
        print("\nCitations Grounding:")
        for c in data.get("citations", []):
            print(f"  [{c['source']}#{c['chunk_id']}] {c['text'][:100]}...")
    except Exception as e:
        print(f"Error querying /v1/chat: {e}")
        
    # 2. RCA
    print_header("FLOW 2: Root Cause Analysis Draft (JSON)")
    start = "2026-07-01T00:00:00"
    end = "2026-07-05T23:59:59"
    print(f"User Selection: Time Window from {start} to {end}\n")
    try:
        res = client.post(f"{API_URL}/v1/rca", json={
            "start_ts": start,
            "end_ts": end
        })
        res.raise_for_status()
        rca_data = res.json()
        print("Response (Validated JSON):")
        print(json.dumps(rca_data, indent=2))
    except Exception as e:
        print(f"Error querying /v1/rca: {e}")
        rca_data = None

    # 3. Brief
    if rca_data:
        print_header("FLOW 3: Plain-English Executive Briefing")
        try:
            res = client.post(f"{API_URL}/v1/brief", json={"rca_data": rca_data})
            res.raise_for_status()
            print("Response (Jargon-free, <=300 words):")
            print(res.json().get("brief"))
        except Exception as e:
            print(f"Error querying /v1/brief: {e}")
            
    print("\n" + "=" * 60)
    print(" Live walkthrough finished! ")
    print("=" * 60)

def main():
    # Check if gateway is active
    try:
        res = httpx.get(f"{API_URL}/v1/health")
        if res.status_code == 200:
            run_live_demo()
            return
    except Exception:
        pass
    run_mock_demo()

if __name__ == "__main__":
    main()
