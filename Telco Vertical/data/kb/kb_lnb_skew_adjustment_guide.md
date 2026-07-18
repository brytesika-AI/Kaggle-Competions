# LNB Skew Angle Adjustment Guide

## 1. Description
LNB (Low Noise Block) skew refers to the rotation of the LNB relative to the satellite dish mount. Correct skew alignment is critical to ensure proper separation of horizontally and vertically polarized signals.

## 2. Diagnostics
Incorrect skew leads to cross-polarization interference, resulting in:
- High SS-RSRP (strong signal level) but poor SS-SINR (low signal quality).
- Intermittent tuner unlocking (`TUN-E1042`) on vertical transponders while horizontal transponders lock successfully.

## 3. Adjustment Steps
- Loosen LNB collar screw.
- Rotate LNB clockwise or counter-clockwise in 2-degree increments.
- Monitor signal quality indicator (SNR) until maximum value is reached.
