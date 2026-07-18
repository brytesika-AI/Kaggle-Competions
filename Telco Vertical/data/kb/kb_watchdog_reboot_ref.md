# Watchdog Timeout Memory Exhaustion (WDT-E0100)

## 1. Description
The error code `WDT-E0100` indicates a watchdog daemon timeout. The hardware watchdog timer triggers a hard reboot because the kernel or main application became unresponsive, typically due to a gradual memory leak.

## 2. Technical Signature
- **Error Code**: `WDT-E0100`
- **Severity**: CRITICAL
- **Symptoms**: Gradual slowdown of UI navigation, delayed response to remote control, and sudden reboot without warning.
- **Diagnostics**: Free memory metric showing steady decline over multiple days.

## 3. Causes
- **Memory Leak in UI Application**: Weaver-Lite models running version `v1.9.9` experience a memory leak in the graphic assets cache, leaking ~20MB per app session launch, eventually leading to Out-Of-Memory (OOM) triggers.

## 4. Remediation Checklist
- Reboot the decoder to clear memory cache.
- Advise customer to minimize opening and closing the app portal repeatedly.
- Update Weaver-Lite firmware to v2.0.2 to apply memory leak patch.
