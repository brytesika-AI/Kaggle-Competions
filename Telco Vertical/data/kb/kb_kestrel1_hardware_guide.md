# Kestrel-1 Decoder Hardware Reference

## 1. Specifications
- **CPU**: Dual-core ARM Cortex-A53 @ 1.2 GHz
- **RAM**: 1GB DDR3
- **Demodulator**: Silicon Labs Si2183-B30 (DVB-S2/T2/C hybrid)
- **Primary storage**: 2GB NAND flash
- **OS**: Embedded Linux 4.9 kernel

## 2. Driver Layer Notes
The Kestrel-1 uses a proprietary tuner kernel module `tuner_si2183.ko`. 
- Firmware version `v1.4.2` introduced a regression in the driver's signal loss handler.
- If the SNR drops below 9.5 dB, the driver enters an infinite lock-check loop without releasing CPU registers. This causes high CPU usage and eventual driver crash, reported as `TUN-E1042`.

## 3. Workarounds
- Force LNB frequency drift offset tuning in the bootloader configurations.
- Update device to firmware `v1.4.3` (which includes driver patch to reset the bus on timeout).
