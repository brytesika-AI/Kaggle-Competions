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
from typing import Dict, Any

from fleetmind.chains.rca import call_llm

logger = logging.getLogger("fleetmind.chains.brief")

PROMPT_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "prompts", "brief.txt")

def load_brief_prompt() -> str:
    with open(PROMPT_PATH, "r", encoding="utf-8") as f:
        return f.read()

async def run_brief_flow(rca_data: Dict[str, Any]) -> str:
    """
    Generates a plain-English, jargon-free executive brief of <= 300 words.
    """
    brief_prompt_template = load_brief_prompt()
    
    # Format the prompt
    formatted_rca_str = json.dumps(rca_data, indent=2)
    prompt = brief_prompt_template.format(rca_json=formatted_rca_str)
    
    # Call the LLM
    response = await call_llm(
        prompt, 
        system_prompt="You are FleetMind, an executive brief writer. Keep it concise, quantified, and jargon-free."
    )
    
    return response.strip()
