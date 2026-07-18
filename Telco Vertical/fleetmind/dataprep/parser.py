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
from typing import List, Dict, Any
import pandas as pd

logger = logging.getLogger("fleetmind.parser")

def parse_and_cluster_logs(log_file_paths: List[str]) -> List[Dict[str, Any]]:
    """
    Parses raw telemetry log files (JSONL) and clusters errors statistically.
    Returns a list of structured anomaly cluster summaries.
    """
    all_logs = []
    
    for path in log_file_paths:
        if not os.path.exists(path):
            logger.warning(f"Log file not found: {path}")
            continue
        logger.info(f"Parsing logs from {path}...")
        with open(path, "r") as f:
            for line in f:
                try:
                    all_logs.append(json.loads(line.strip()))
                except Exception:
                    # skip malformed lines
                    continue
                    
    if not all_logs:
        logger.warning("No logs parsed.")
        return []
        
    df = pd.DataFrame(all_logs)
    
    # Check for empty dataframe
    if df.empty:
        return []
        
    # Convert timestamps to datetime
    df["timestamp"] = pd.to_datetime(df["timestamp"])
    
    # Filter for anomalies: logs with levels WARNING, ERROR, CRITICAL or non-null error code
    anomalies = df[(df["level"].isin(["WARNING", "ERROR", "CRITICAL"])) | (df["code"].notna() & (df["code"] != ""))]
    
    if anomalies.empty:
        logger.info("No anomalies found in the provided logs.")
        return []
        
    # Group by code, model, firmware, region
    # To handle potential missing columns, check their presence
    group_cols = [c for c in ["code", "model", "firmware", "region"] if c in anomalies.columns]
    
    clusters = []
    
    grouped = anomalies.groupby(group_cols)
    for group_keys, group_df in grouped:
        # Create group dictionary
        g_dict = dict(zip(group_cols, group_keys if isinstance(group_keys, tuple) else [group_keys]))
        
        code = g_dict.get("code")
        model = g_dict.get("model")
        firmware = g_dict.get("firmware")
        region = g_dict.get("region")
        
        # Calculate cluster statistics
        min_ts = group_df["timestamp"].min().isoformat()
        max_ts = group_df["timestamp"].max().isoformat()
        total_events = len(group_df)
        unique_devices = group_df["device_id"].nunique()
        
        # Calculate percentage of affected devices in this model/firmware group
        total_group_devices = df[(df["model"] == model) & (df["firmware"] == firmware)]["device_id"].nunique()
        pct_affected = (unique_devices / max(1, total_group_devices))
        
        # Message snippet
        messages = group_df["message"].dropna().tolist()
        snippet = messages[0] if messages else "No message snippet"
        
        # Calculate metric averages
        metrics_list = group_df["metrics"].dropna().tolist()
        avg_snr = None
        avg_mem = None
        if metrics_list:
            snrs = [m.get("snr") for m in metrics_list if m.get("snr") is not None]
            mems = [m.get("free_mem") for m in metrics_list if m.get("free_mem") is not None]
            if snrs:
                avg_snr = sum(snrs) / len(snrs)
            if mems:
                avg_mem = sum(mems) / len(mems)
                
        # Format a structured textual chunk for embedding
        chunk_text = (
            f"Anomaly Cluster Summary:\n"
            f"- Error Code: {code}\n"
            f"- Device Model: {model}\n"
            f"- Firmware Version: {firmware}\n"
            f"- Region: {region}\n"
            f"- Time Range: {min_ts} to {max_ts}\n"
            f"- Total Events Count: {total_events}\n"
            f"- Unique Devices Affected: {unique_devices} ({pct_affected:.1%} of model-firmware group)\n"
            f"- Sample Error Message: {snippet}\n"
        )
        if avg_snr is not None:
            chunk_text += f"- Average Signal SNR: {avg_snr:.2f}dB\n"
        if avg_mem is not None:
            chunk_text += f"- Average Free Memory: {avg_mem:.1f}MB\n"
            
        cluster_record = {
            "text": chunk_text,
            "metadata": {
                "doc_type": "telemetry_anomaly",
                "source": f"telemetry_{min_ts[:10]}",
                "error_code": code,
                "device_model": model,
                "firmware": firmware,
                "region": region,
                "start_time": min_ts,
                "end_time": max_ts,
                "event_count": total_events,
                "affected_devices": unique_devices,
                "percentage_affected": pct_affected
            }
        }
        clusters.append(cluster_record)
        
    return clusters


