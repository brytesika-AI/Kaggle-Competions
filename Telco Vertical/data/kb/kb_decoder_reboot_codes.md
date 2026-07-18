# Decoder Reboot Codes Reference Guide

## 1. Scope
This document defines the reboot reason codes logged by the decoder kernel during bootup, used to differentiate software panics from hard power losses.

## 2. Reboot Reason Code Matrix
- **RBT-C0001 (Cold Boot)**: Normal startup after power socket was disconnected and re-plugged.
- **RBT-S0102 (Soft Reset)**: User initiated reboot from settings menu.
- **RBT-W0200 (Watchdog Reset)**: Reboot triggered by hardware watchdog timeout (`WDT-E0100`).
- **RBT-P0300 (Power Drop / Brownout)**: Power supply voltage dropped below 10.8V.
- **RBT-F0400 (Firmware Flash Reboot)**: Automatic reboot triggered by bootloader post OTA update.

## 3. Operations Triage
Use reboot codes to filter out false alarms:
- `RBT-P0300` indicates regional grid instability.
- `RBT-W0200` combined with low free memory indicates memory leak software bugs.
