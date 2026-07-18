# RF Signal Quality and Diagnostics Primer

## 1. Key Metrics
For digital satellite and hybrid telecom decoders, signal health is measured by three primary metrics:

1. **SS-RSRP (Signal Strength)**: Measured in dBm. Ranges from -120 dBm (poor) to -40 dBm (excellent).
2. **SS-SINR (Signal to Interference & Noise Ratio)**: Ranges from -10 dB to +30 dB. Higher is better.
3. **SNR (Signal-to-Noise Ratio)**: Measured in dB. Lock threshold is typically at 9.0dB. Below this, tuner driver issues emerge.

## 2. Signal Threshold Matrix
| Metric | Poor (Unlocking) | Marginal (Unstable) | Good (Stable) |
|---|---|---|---|
| SS-RSRP | < -105 dBm | -105 to -90 dBm | > -90 dBm |
| SS-SINR | < -3 dB | -3 to +10 dB | > +10 dB |
| SNR | < 9.0 dB | 9.0 to 11.5 dB | > 11.5 dB |

## 3. Diagnostics
- High signal strength but poor SNR indicates local noise interference or LNB drift.
- Both low signal strength and poor SNR indicate dish/LNB misalignment, cable damage, or severe weather fade.
