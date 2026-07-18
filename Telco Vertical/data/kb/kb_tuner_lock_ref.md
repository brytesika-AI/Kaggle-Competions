# Troubleshooting Tuner Lock Failures (TUN-E1042)

## 1. Description
The error code `TUN-E1042` indicates a tuner lock driver failure. The Set-Top Box (STB) front-end demodulator (typically the Si2183 chip) fails to obtain a stable signal lock on the target transponder frequency.

## 2. Technical Signature
- **Error Code**: `TUN-E1042`
- **Severity**: ERROR
- **Symptoms**: Screen freezing, black screen, "No Signal" banner, reboot loops (when escalating).
- **Diurnal correlation**: Spikes during local temperature changes (which shifts LNB local oscillator frequency) or rain fade.

## 3. Causes
1. **Low Signal-to-Noise Ratio (SNR)**: The regional signal quality falls below the lock threshold.
2. **Firmware Demodulator Bug**: In certain firmware versions (e.g., Kestrel-1 v1.4.2), the tuner lock driver lacks automatic frequency control (AFC) correction under low-SNR conditions, causing the driver to crash instead of retrying.
3. **LNB Drifting**: High local oscillator frequency drift on older LNBs.

## 4. Remediation Checklist
- Verify SS-RSRP and SS-SINR parameters.
- Check LNB mechanical alignment.
- Roll back firmware to a stable version (e.g., v1.4.1) if running Kestrel-1 v1.4.2 in a low-SNR region.
