# Weaver-Lite Decoder Hardware Reference

## 1. Specifications
- **CPU**: Single-core MIPS @ 800 MHz
- **RAM**: 512MB DDR2
- **Watchdog Timer**: Integrated hardware watchdog daemon (MIPS internal).
- **Firmware affected**: `v1.9.9` (slow memory leak), `v2.0.1` (NTP clock sync bug).

## 2. Watchdog and Memory Limits
Due to the small RAM footprint (512MB), Weaver-Lite is highly sensitive to memory leaks.
- Out of 512MB RAM, the system allocates 128MB for GPU framebuffers, leaving 384MB for system and user applications.
- If free memory drops below 64MB, system performance degrades.
- Below 32MB, the hardware watchdog daemon triggers reboot (`WDT-E0100`) to prevent kernel panic.

## 3. NTP Sync Issue in v2.0.1
In firmware version `v2.0.1`, a regression in the networking loop causes NTP client socket creation to fail during cold startup. This leads to `CLK-E0007` errors and resets the system time to the 1970-01-01 epoch.
