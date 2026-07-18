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
import random
import argparse
from datetime import datetime, timedelta, timezone

def generate_telemetry(devices_count: int, days: int, seed: int, out_dir: str):
    random.seed(seed)
    
    # Define populations
    models = ["Kestrel-1", "Kestrel-2", "Ibis-4K", "Weaver-Lite"]
    firmwares = {
        "Kestrel-1": ["v1.4.1", "v1.4.2"],
        "Kestrel-2": ["v2.0.0"],
        "Ibis-4K": ["v3.0.9", "v3.1.0"],
        "Weaver-Lite": ["v1.9.8", "v1.9.9", "v2.0.1"]
    }
    regions = ["ZA-GP", "ZA-WC", "ZA-KZN", "ZA-NC", "ZA-EC"]
    
    # Create output directory
    os.makedirs(out_dir, exist_ok=True)
    
    # Initialize devices
    devices = []
    for i in range(devices_count):
        dev_id = f"STB-{i:06d}"
        model = random.choice(models)
        firmware = random.choice(firmwares[model])
        region = random.choice(regions)
        
        # Baselines
        snr_baseline = random.uniform(15.0, 30.0)
        if region == "ZA-NC": # low-SNR region baseline
            snr_baseline = random.uniform(8.0, 14.0)
            
        devices.append({
            "device_id": dev_id,
            "model": model,
            "firmware": firmware,
            "region": region,
            "snr_baseline": snr_baseline,
            "scenario": None # assigned during scenario injection
        })
    
    # Setup failure scenarios time range
    start_time = datetime(2026, 7, 1, 0, 0, 0, tzinfo=timezone.utc)
    
    # Choose affected subset of devices for each scenario
    ground_truth = []
    
    # 1. tuner_lock_cascade: Kestrel-1 with v1.4.2 in low-SNR region (ZA-NC)
    tuner_affected = [
        d for d in devices 
        if d["model"] == "Kestrel-1" and d["firmware"] == "v1.4.2" and d["region"] == "ZA-NC"
    ]
    # Inject into top 30% of eligible devices
    tuner_sample = random.sample(tuner_affected, min(len(tuner_affected), 50))
    for d in tuner_sample:
        d["scenario"] = "tuner_lock_cascade"
    ground_truth.append({
        "scenario": "tuner_lock_cascade",
        "affected_model": "Kestrel-1",
        "affected_firmware": "v1.4.2",
        "affected_region": "ZA-NC",
        "device_count": len(tuner_sample),
        "target_error": "TUN-E1042",
        "description": "Firmware bug in Kestrel-1 v1.4.2 leads to tuner driver crashes under low-SNR conditions, causing reboot loops."
    })
    
    # 2. epoch_reset_ota: Weaver-Lite devices that got v2.0.1 firmware update
    epoch_affected = [
        d for d in devices 
        if d["model"] == "Weaver-Lite" and d["firmware"] == "v2.0.1"
    ]
    epoch_sample = random.sample(epoch_affected, min(len(epoch_affected), 40))
    for d in epoch_sample:
        d["scenario"] = "epoch_reset_ota"
    ground_truth.append({
        "scenario": "epoch_reset_ota",
        "affected_model": "Weaver-Lite",
        "affected_firmware": "v2.0.1",
        "affected_region": "any",
        "device_count": len(epoch_sample),
        "target_error": "CLK-E0007",
        "description": "Clock initialization failure on Weaver-Lite v2.0.1 causing timestamps to reset to 1970-01-01 epoch."
    })
    
    # 3. otp_read_storm: Ibis-4K with v3.1.0 firmware
    otp_affected = [
        d for d in devices 
        if d["model"] == "Ibis-4K" and d["firmware"] == "v3.1.0"
    ]
    otp_sample = random.sample(otp_affected, min(len(otp_affected), 60))
    for d in otp_sample:
        d["scenario"] = "otp_read_storm"
    ground_truth.append({
        "scenario": "otp_read_storm",
        "affected_model": "Ibis-4K",
        "affected_firmware": "v3.1.0",
        "affected_region": "any",
        "device_count": len(otp_sample),
        "target_error": "SEC-E0311",
        "description": "Secure OTP read storm on Ibis-4K v3.1.0. Error Flag=0 indicates benign retry; Flag=1 indicates hardware authentication failure."
    })
    
    # 4. ota_partial_brick: Kestrel-2 on power unstable region (ZA-EC)
    brick_affected = [
        d for d in devices 
        if d["model"] == "Kestrel-2" and d["region"] == "ZA-EC"
    ]
    brick_sample = random.sample(brick_affected, min(len(brick_affected), 35))
    for d in brick_sample:
        d["scenario"] = "ota_partial_brick"
    ground_truth.append({
        "scenario": "ota_partial_brick",
        "affected_model": "Kestrel-2",
        "affected_firmware": "v2.0.0",
        "affected_region": "ZA-EC",
        "device_count": len(brick_sample),
        "target_error": "OTA-E0550",
        "description": "Interrupted OTA update during power brownout on Kestrel-2 leaves devices in recovery boot loop."
    })
    
    # 5. memory_leak_slowburn: Weaver-Lite with v1.9.9
    leak_affected = [
        d for d in devices 
        if d["model"] == "Weaver-Lite" and d["firmware"] == "v1.9.9"
    ]
    leak_sample = random.sample(leak_affected, min(len(leak_affected), 45))
    for d in leak_sample:
        d["scenario"] = "memory_leak_slowburn"
    ground_truth.append({
        "scenario": "memory_leak_slowburn",
        "affected_model": "Weaver-Lite",
        "affected_firmware": "v1.9.9",
        "affected_region": "any",
        "device_count": len(leak_sample),
        "target_error": "WDT-E0100",
        "description": "Gradual memory leak over days on Weaver-Lite v1.9.9 ends in watchdog reboots due to application memory exhaustion."
    })
    
    # Write Ground Truth
    with open(os.path.join(out_dir, "ground_truth.json"), "w") as f:
        json.dump(ground_truth, f, indent=2)
        
    # Write Logs in daily splits to mimic production ingest
    logs_written = 0
    for day in range(days):
        current_day_str = (start_time + timedelta(days=day)).strftime("%Y-%m-%d")
        log_file_path = os.path.join(out_dir, f"telemetry_{current_day_str}.jsonl")
        
        with open(log_file_path, "w") as lf:
            for d in devices:
                # 99% of normal devices send 1 daily heartbeat to save disk space
                if d["scenario"] is None:
                    if random.random() < 0.15: # subset of normal devices reports daily to keep telemetry clean
                        ts = start_time + timedelta(days=day, hours=random.randint(0, 23))
                        lf.write(json.dumps({
                            "timestamp": ts.isoformat(),
                            "device_id": d["device_id"],
                            "model": d["model"],
                            "firmware": d["firmware"],
                            "region": d["region"],
                            "level": "INFO",
                            "code": None,
                            "message": "System heartbeat OK",
                            "metrics": {"snr": d["snr_baseline"], "free_mem": 512, "uptime": 86400}
                        }) + "\n")
                        logs_written += 1
                    continue
                
                # Device is affected by a scenario. Generate hourly/frequent logs
                scenario = d["scenario"]
                for hour in range(24):
                    ts = start_time + timedelta(days=day, hours=hour)
                    
                    # Normal diurnal variation or SNR reading
                    current_snr = d["snr_baseline"] + random.uniform(-1.0, 1.0)
                    
                    if scenario == "tuner_lock_cascade":
                        # Escalates over days
                        prob = min(0.9, (day / max(1, days-1)) * 0.8 + 0.1)
                        if random.random() < prob:
                            lf.write(json.dumps({
                                "timestamp": ts.isoformat(),
                                "device_id": d["device_id"],
                                "model": d["model"],
                                "firmware": d["firmware"],
                                "region": d["region"],
                                "level": "ERROR",
                                "code": "TUN-E1042",
                                "message": f"Tuner lock driver failed. RSRP/RSRQ stable but SNR low: {current_snr:.2f}dB",
                                "metrics": {"snr": current_snr, "free_mem": 412, "uptime": random.randint(300, 3600)}
                            }) + "\n")
                            logs_written += 1
                            
                    elif scenario == "epoch_reset_ota":
                        # After day 3 (midpoint update), device gets updated and experiences failures
                        if day >= 3:
                            # 1970 Epoch Reset timestamp
                            bad_ts = datetime(1970, 1, 1, hour, random.randint(0, 59), random.randint(0, 59), tzinfo=timezone.utc)
                            lf.write(json.dumps({
                                "timestamp": bad_ts.isoformat(),
                                "device_id": d["device_id"],
                                "model": d["model"],
                                "firmware": "v2.0.1", # forced update
                                "region": d["region"],
                                "level": "CRITICAL",
                                "code": "CLK-E0007",
                                "message": "Clock initialization failure. NTP sync timeout. Resetting to default epoch.",
                                "metrics": {"snr": current_snr, "free_mem": 380, "uptime": 10}
                            }) + "\n")
                            logs_written += 1
                            
                    elif scenario == "otp_read_storm":
                        # Spike in secure errors
                        if random.random() < 0.4:
                            flag = 1 if random.random() < 0.25 else 0 # 25% are Flag=1 hard failures
                            lf.write(json.dumps({
                                "timestamp": ts.isoformat(),
                                "device_id": d["device_id"],
                                "model": d["model"],
                                "firmware": d["firmware"],
                                "region": d["region"],
                                "level": "ERROR" if flag == 0 else "CRITICAL",
                                "code": "SEC-E0311",
                                "message": f"Secure OTP core hardware read failed. Flag={flag}. Entitlement status mismatch.",
                                "metrics": {"snr": current_snr, "free_mem": 450, "uptime": 5400}
                            }) + "\n")
                            logs_written += 1
                            
                    elif scenario == "ota_partial_brick":
                        # Stuck in recovery loop
                        if day >= 5 and random.random() < 0.7:
                            lf.write(json.dumps({
                                "timestamp": ts.isoformat(),
                                "device_id": d["device_id"],
                                "model": d["model"],
                                "firmware": d["firmware"],
                                "region": d["region"],
                                "level": "CRITICAL",
                                "code": "OTA-E0550",
                                "message": "Interrupted partition flashing. Bootloader recovery partition checksum invalid.",
                                "metrics": {"snr": current_snr, "free_mem": 128, "uptime": 15}
                            }) + "\n")
                            logs_written += 1
                            
                    elif scenario == "memory_leak_slowburn":
                        # Free memory decreases over time
                        initial_mem = 512
                        leak_rate = (day * 24 + hour) * 1.5 # MB lost over time
                        current_mem = max(32, initial_mem - leak_rate)
                        
                        if current_mem < 64:
                            # Watchdog reboot triggers
                            if random.random() < 0.3:
                                lf.write(json.dumps({
                                    "timestamp": ts.isoformat(),
                                    "device_id": d["device_id"],
                                    "model": d["model"],
                                    "firmware": d["firmware"],
                                    "region": d["region"],
                                    "level": "CRITICAL",
                                    "code": "WDT-E0100",
                                    "message": "Watchdog timeout. System memory exhausted. Forcing hard reboot.",
                                    "metrics": {"snr": current_snr, "free_mem": current_mem, "uptime": 300}
                                }) + "\n")
                                logs_written += 1
                        else:
                            # Normal app logs showing decreasing memory
                            if random.random() < 0.1:
                                lf.write(json.dumps({
                                    "timestamp": ts.isoformat(),
                                    "device_id": d["device_id"],
                                    "model": d["model"],
                                    "firmware": d["firmware"],
                                    "region": d["region"],
                                    "level": "WARN",
                                    "code": None,
                                    "message": "Low memory warning. Application session running active.",
                                    "metrics": {"snr": current_snr, "free_mem": current_mem, "uptime": (day*24 + hour)*3600}
                                }) + "\n")
                                logs_written += 1

    print(f"Generated deterministic telemetry for {devices_count} devices over {days} days.")
    print(f"Total logs written: {logs_written}. Saved to {out_dir}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="FleetMind Deterministic Synthetic Telemetry Generator")
    parser.add_argument("--devices", type=int, default=50000, help="Total devices population size")
    parser.add_argument("--days", type=int, default=14, help="Simulation duration in days")
    parser.add_argument("--seed", type=int, default=42, help="Random seed for reproducibility")
    parser.add_argument("--out", type=str, default="data/telemetry/", help="Output directory path")
    
    args = parser.parse_args()
    generate_telemetry(args.devices, args.days, args.seed, args.out)
