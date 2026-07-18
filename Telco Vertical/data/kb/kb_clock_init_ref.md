# NTP and Clock Sync Troubleshooting (CLK-E0007)

## 1. Description
The error code `CLK-E0007` indicates a clock initialization failure. Upon system boot, the kernel daemon fails to parse the real-time clock (RTC) registers or establish contact with the network time protocol (NTP) servers.

## 2. Technical Signature
- **Error Code**: `CLK-E0007`
- **Severity**: CRITICAL
- **Symptoms**: System clock resets to Unix epoch (`1970-01-01 00:00:00`), scheduler crashes, Guide data fails to load, secure HTTPS handshakes fail due to certificate validity checks.
- **Hardware affected**: Frequently observed on Weaver-Lite models running firmware version `v2.0.1`.

## 3. Root Cause
- **NTP Timeout**: The network connection is established *after* the bootloader clock sync daemon times out.
- **Firmware Driver bug**: Weaver-Lite v2.0.1 includes a regression in the clock-sync loop that enters a sleep state without retrying, leaving the clock stuck at 1970-01-01.

## 4. Remediation Checklist
- Perform hard power cycle to force a bootloader-level clock sync.
- Check DNS resolution for pool.ntp.org.
- Update/Downgrade firmware to a version with a robust retry sync daemon (e.g., Weaver-Lite v1.9.8 or v2.0.2).
