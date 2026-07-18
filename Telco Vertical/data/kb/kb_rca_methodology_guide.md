# Root Cause Analysis (RCA) Methodology Guide

## 1. Goal
Provide structured guidelines for network operations engineers to diagnose STB/network failures, assign confidence scores, and document evidence.

## 2. Confidence Definitions
Operations engineers must classify probable causes using three confidence tiers:
1. **HIGH**: The root cause matches a deterministic log signature (e.g. `CLK-E0007` on Weaver-Lite v2.0.1) and affected device metrics match perfectly.
2. **MED**: Multiple symptoms align with the hypothesis, but telemetry contains missing files or overlapping scenarios (e.g., reboots occurring in both memory leak and OTA brick windows).
3. **LOW**: Correlative evidence only. Lack of definitive log error codes.

## 3. Evidence Logging
All RCAs must include specific evidence citations pointing to either:
- The log code and timestamp range (e.g., `telemetry_2026-07-02#TUN-E1042`).
- The relevant KB troubleshooting article (e.g., `kb_tuner_lock_ref.md`).
