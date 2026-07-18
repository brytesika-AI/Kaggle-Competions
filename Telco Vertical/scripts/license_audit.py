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

import sys
import subprocess

def run_audit():
    print("============================================")
    print("          FleetMind License Audit           ")
    print("============================================")
    
    import importlib.util
    if importlib.util.find_spec("pip_licenses") is None:
        print("Installing pip-licenses...")
        subprocess.run([sys.executable, "-m", "pip", "install", "-q", "pip-licenses"])
        
    print("Running package license audit...")
    # Run pip-licenses as a subprocess to capture output
    result = subprocess.run(
        [sys.executable, "-m", "piplicenses", "--format=csv", "--ignore-packages", "pip", "setuptools", "pkg-resources", "wheels"],
        capture_output=True,
        text=True
    )
    
    if result.returncode != 0:
        print(f"ERROR running pip-licenses: {result.stderr}")
        sys.exit(1)
        
    lines = result.stdout.strip().split("\n")
    if not lines:
        print("No packages found.")
        sys.exit(0)
        
    print(f"Audited {len(lines) - 1} packages.")
    
    forbidden = ["gpl", "lgpl", "agpl", "gnu"]
    violations = []
    
    # Simple CSV parser
    for line in lines[1:]: # skip header
        parts = line.replace('"', '').split(",")
        if len(parts) >= 3:
            name, version, license_name = parts[0], parts[1], parts[2]
            print(f"  - {name} ({version}): {license_name}")
            
            license_lower = license_name.lower()
            for f in forbidden:
                if f in license_lower:
                    violations.append((name, version, license_name))
                    break
                    
    if violations:
        print("\nERROR: Forbidden licenses found (GPL/LGPL/AGPL/GNU):")
        for v in violations:
            print(f"  !!! VIOLATION: {v[0]} ({v[1]}) under {v[2]} !!!")
        sys.exit(1)
    else:
        print("\nAudit passed: Zero GPL/LGPL/AGPL packages detected.")
        print("============================================")
        sys.exit(0)

if __name__ == "__main__":
    run_audit()
