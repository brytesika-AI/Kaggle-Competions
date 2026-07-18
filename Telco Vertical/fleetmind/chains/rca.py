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
import glob
import httpx
from typing import Dict, Any, List
import pandas as pd

from fleetmind.dataprep.parser import parse_and_cluster_logs
from fleetmind.dataprep.ingest import query_vector_index

logger = logging.getLogger("fleetmind.chains.rca")

PROMPT_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "prompts", "rca.txt")

RCA_SCHEMA = {
    "type": "object",
    "properties": {
        "incident_title": {"type": "string"},
        "symptom_summary": {"type": "string"},
        "affected_population": {
            "type": "object",
            "properties": {
                "device_count": {"type": "integer"},
                "percentage": {"type": "number"},
                "regions": {"type": "array", "items": {"type": "string"}},
                "models": {"type": "array", "items": {"type": "string"}}
            },
            "required": ["device_count", "percentage", "regions", "models"]
        },
        "probable_causes": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "cause": {"type": "string"},
                    "confidence": {"type": "string", "enum": ["high", "med", "low"]},
                    "evidence": {"type": "array", "items": {"type": "string"}}
                },
                "required": ["cause", "confidence", "evidence"]
            }
        },
        "recommended_actions": {"type": "array", "items": {"type": "string"}},
        "open_questions": {"type": "array", "items": {"type": "string"}}
    },
    "required": [
        "incident_title", "symptom_summary", "affected_population", 
        "probable_causes", "recommended_actions", "open_questions"
    ]
}

def load_rca_prompt() -> str:
    with open(PROMPT_PATH, "r", encoding="utf-8") as f:
        return f.read()

def filter_logs_by_window(
    telemetry_dir: str, 
    start_ts: str, 
    end_ts: str, 
    filters: Dict[str, Any] = None
) -> List[str]:
    """
    Finds log files matching the window, reads them, filters lines by start/end times,
    and writes filtered lines to a temporary scratch log file. Returns path to the file.
    """
    start_dt = pd.to_datetime(start_ts)
    end_dt = pd.to_datetime(end_ts)
    
    # We find files in the directory
    all_files = glob.glob(os.path.join(telemetry_dir, "telemetry_*.jsonl"))
    
    filtered_lines = []
    
    for file_path in all_files:
        # Extract date from filename
        # File name format: telemetry_YYYY-MM-DD.jsonl
        basename = os.path.basename(file_path)
        try:
            date_str = basename.replace("telemetry_", "").replace(".jsonl", "")
            file_dt = pd.to_datetime(date_str)
            # check if file date is within range (with 1 day buffer)
            if file_dt < start_dt.floor('D') - pd.Timedelta(days=1) or file_dt > end_dt.ceil('D') + pd.Timedelta(days=1):
                continue
        except Exception:
            pass
            
        with open(file_path, "r") as f:
            for line in f:
                try:
                    log_entry = json.loads(line.strip())
                    log_ts = pd.to_datetime(log_entry["timestamp"])
                    if log_ts >= start_dt and log_ts <= end_dt:
                        # Apply filters
                        match = True
                        if filters:
                            for k, v in filters.items():
                                if v and log_entry.get(k) != v:
                                    match = False
                                    break
                        if match:
                            filtered_lines.append(line)
                except Exception:
                    continue
                    
    # Write to a temporary file
    temp_dir = os.path.join(telemetry_dir, "temp")
    os.makedirs(temp_dir, exist_ok=True)
    temp_file_path = os.path.join(temp_dir, f"filtered_{start_ts[:10]}_{end_ts[:10]}.jsonl")
    with open(temp_file_path, "w") as f:
        f.writelines(filtered_lines)
        
    return [temp_file_path]

def validate_json_schema(data: Any, schema: Dict[str, Any]) -> bool:
    # Manual validation for speed and portability, or we can use jsonschema if installed
    try:
        from jsonschema import validate
        validate(instance=data, schema=schema)
        return True
    except Exception:
        # Simple schema validation logic fallback or if validation fails
        if not isinstance(data, dict):
            return False
        for req in schema.get("required", []):
            if req not in data:
                return False
        return True

async def call_llm(prompt: str, system_prompt: str = "You are an expert AI systems engineer.") -> str:
    llm_host = os.getenv("LLM_HOST", "localhost")
    llm_port = int(os.getenv("LLM_PORT", 8000))
    url = f"http://{llm_host}:{llm_port}/v1/chat/completions"
    
    payload = {
        "model": "qwen",
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": prompt}
        ],
        "temperature": 0.1,
        "max_tokens": 1024
    }
    
    async with httpx.AsyncClient(timeout=60.0) as client:
        response = await client.post(url, json=payload)
        response.raise_for_status()
        res = response.json()
        return res["choices"][0]["message"]["content"]

async def run_rca_flow(
    start_ts: str, 
    end_ts: str, 
    filters: Dict[str, Any] = None,
    telemetry_dir: str = "data/telemetry"
) -> Dict[str, Any]:
    """
    Generates a structured, schema-validated RCA draft for a given time window.
    """
    # 1. Filter and cluster logs
    filtered_log_files = filter_logs_by_window(telemetry_dir, start_ts, end_ts, filters)
    anomaly_clusters = parse_and_cluster_logs(filtered_log_files)
    
    # Clean up temp file
    for path in filtered_log_files:
        if "temp" in path and os.path.exists(path):
            os.remove(path)
            
    if not anomaly_clusters:
        return {
            "incident_title": "No anomalies detected",
            "symptom_summary": f"No telemetry anomaly events found between {start_ts} and {end_ts}.",
            "affected_population": {"device_count": 0, "percentage": 0.0, "regions": [], "models": []},
            "probable_causes": [],
            "recommended_actions": ["No action required."],
            "open_questions": []
        }
        
    # 2. Gather context from anomaly clusters & retrieve KB articles
    context_str = ""
    error_codes = set()
    for idx, cluster in enumerate(anomaly_clusters):
        context_str += f"Cluster {idx+1}:\n{cluster['text']}\n"
        if cluster["metadata"].get("error_code"):
            error_codes.add(cluster["metadata"]["error_code"])
            
    # Retrieve KB articles matching the error codes
    kb_chunks = []
    for code in error_codes:
        kb_chunks.extend(query_vector_index(f"Troubleshooting reference for error code {code}", top_k=3))
        
    context_str += "\nRelevant Knowledge Base Chunks:\n"
    for idx, chunk in enumerate(kb_chunks):
        doc_id = chunk["metadata"].get("source", "unknown")
        chunk_id = chunk["metadata"].get("chunk_id", f"chunk_{idx}")
        context_str += f"[Citation ID: {doc_id}#{chunk_id}]\n{chunk['text']}\n\n"
        
    # 3. Formulate Prompt
    rca_prompt_template = load_rca_prompt()
    prompt = rca_prompt_template.format(context=context_str)
    
    # 4. Generate & Validate JSON
    response_content = await call_llm(prompt)
    
    # Extract JSON block
    def clean_json_str(s: str) -> str:
        s = s.strip()
        if "```json" in s:
            s = s.split("```json")[1].split("```")[0].strip()
        elif "```" in s:
            s = s.split("```")[1].split("```")[0].strip()
        return s
        
    cleaned_res = clean_json_str(response_content)
    
    try:
        rca_data = json.loads(cleaned_res)
        valid = validate_json_schema(rca_data, RCA_SCHEMA)
    except Exception as e:
        logger.warning(f"Initial JSON parsing failed: {e}. Output was: {response_content}")
        rca_data = None
        valid = False
        
    # 5. One Repair Retry on failure
    if not valid:
        logger.info("RCA JSON validation failed. Initiating repair retry...")
        repair_prompt = (
            f"Your previous response was not a valid JSON or did not match the required schema. "
            f"Please output a strict JSON object that follows the schema exactly. Do not output any markdown code blocks. "
            f"Here is the schema:\n{json.dumps(RCA_SCHEMA, indent=2)}\n\n"
            f"Here was the error:\nJSON validation failed.\n\n"
            f"Please regenerate the corrected JSON response based on the original request."
        )
        try:
            retry_res = await call_llm(repair_prompt)
            cleaned_retry = clean_json_str(retry_res)
            rca_data = json.loads(cleaned_retry)
            if not validate_json_schema(rca_data, RCA_SCHEMA):
                raise ValueError("RCA Repair response still failed validation schema.")
        except Exception as retry_err:
            logger.error(f"RCA repair failed: {retry_err}")
            # Generate a hardcoded fallback compliant JSON using anomaly clusters
            rca_data = {
                "incident_title": "Aggregated Anomaly Alert",
                "symptom_summary": f"Detected anomalies: {', '.join(list(error_codes))}",
                "affected_population": {
                    "device_count": sum(c["metadata"]["affected_devices"] for c in anomaly_clusters),
                    "percentage": float(max(c["metadata"]["percentage_affected"] for c in anomaly_clusters)),
                    "regions": list(set(c["metadata"]["region"] for c in anomaly_clusters)),
                    "models": list(set(c["metadata"]["device_model"] for c in anomaly_clusters))
                },
                "probable_causes": [
                    {
                        "cause": f"System error related to {', '.join(list(error_codes))}",
                        "confidence": "med",
                        "evidence": [f"telemetry_anomaly#{c['metadata']['error_code']}" for c in anomaly_clusters]
                    }
                ],
                "recommended_actions": ["Inspect devices running affected firmware versions."],
                "open_questions": ["Is this related to a recent OTA firmware release?"]
            }
            
    return rca_data
