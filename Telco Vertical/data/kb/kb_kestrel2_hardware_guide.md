# Kestrel-2 Decoder Hardware Reference

## 1. Specifications
- **CPU**: Quad-core ARM Cortex-A53 @ 1.5 GHz
- **RAM**: 2GB DDR4
- **Primary storage**: 4GB eMMC flash
- **Power profile**: 12V DC, 2A. Susceptible to brownouts under 10.8V.

## 2. Bootloader and Partition Recovery
The Kestrel-2 includes a dual-partition redundant boot system (Active-Active).
- The bootloader verifies the partition checksum before loading the kernel.
- During OTA updates, if power is lost, the flashing of the active partition will be interrupted.
- Upon next boot, the system detects a checksum error, falls back to the recovery partition, and attempts to re-flash. If the power instability persists, it enters a recovery boot loop logging `OTA-E0550`.

## 3. Recovery Procedure
- Connect the decoder to a stable power line.
- Trigger factory recovery flash using the front-panel button combinational reset.
