# Satellite Headend and Transponder Plan

## 1. Scope
This document details the downlink carrier frequencies, polarization, symbol rates, and modulation standards for satellite broadcasts.

## 2. Transponder Frequency Allocation
- **TP1 (Primary carrier)**: 11150 MHz, Vertical polarization, Symbol Rate: 30000 kS/s, Modulation: DVB-S2 QPSK.
- **TP2 (HD Video streams)**: 11230 MHz, Horizontal polarization, Symbol Rate: 30000 kS/s, Modulation: DVB-S2 8PSK.
- **TP3 (Interactive portal data)**: 11590 MHz, Vertical polarization, Symbol Rate: 45000 kS/s, Modulation: DVB-S2 16APSK.

## 3. Demodulator Tuning Limits
Set-Top Boxes must tune to the primary transponder frequency to fetch active network information tables (NIT). LNB drift exceeding +/- 3 MHz will prevent demodulator lock (`TUN-E1042`).
