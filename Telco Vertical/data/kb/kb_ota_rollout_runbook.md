# OTA Rollout Staging Runbook

## 1. Scope
This document outlines the standard operating procedure for deploying Over-The-Air (OTA) firmware updates to the subscriber decoder fleet.

## 2. Phased Rollout Schedule
Deploying updates to the entire fleet simultaneously is strictly prohibited. Use the following phased rollout:
1. **Internal Trial (Stage 1)**: Deploy to employee test group (100 devices). Monitor for 48 hours.
2. **Staged Wave 1 (Stage 2)**: Deploy to 1% of the target region fleet. Check for crash logs and tuner unlock alerts.
3. **Staged Wave 2 (Stage 3)**: Deploy to 10% of the fleet.
4. **General Release (Stage 4)**: Full release to remaining fleet.

## 3. Rollback Protocol
If any wave triggers an increase in critical log alarms (such as `CLK-E0007` or `SEC-E0311` error codes) exceeding a 0.5% threshold:
- Immediately suspend the OTA campaign.
- Send the rollback configuration file targeting the previous stable version.
- Document affected models, firmware versions, and regions in the RCA ticket.
