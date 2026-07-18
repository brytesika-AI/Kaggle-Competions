# Field Technician Checklist for Signal Issues

## 1. Safety First
Ensure all outdoor equipment mounts are secure and proper safety gear is used before accessing rooftops or satellite dishes.

## 2. On-Site Tuner Lock Diagnosis
For reports of screen freeze or black screens (`TUN-E1042`):
- Connect the signal meter directly to the LNB output.
- Measure the local carrier frequency power. RSRP should be above -90 dBm.
- Check the SNR reading. If below 9.0 dB:
  - Adjust LNB skew angle by 2-5 degrees.
  - Inspect satellite dish reflector for warping or debris.
  - Inspect RG6 coaxial cables for physical damage or water ingress.

## 3. STB Verification
- Verify that the STB is powered on and running the latest stable firmware.
- Check the diagnostics menu page and verify the current signal strength and quality indicators.
