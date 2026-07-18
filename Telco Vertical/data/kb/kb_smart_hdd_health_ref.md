# SMART Hard Disk Health Monitoring

## 1. Description
For decoders equipped with Personal Video Recorder (PVR) capabilities (such as Kestrel-2 and Ibis-4K), the system regularly audits internal SATA hard disk drives using S.M.A.R.T. (Self-Monitoring, Analysis, and Reporting Technology).

## 2. Key SMART Attributes
- **Attribute 5 (Reallocated Sectors Count)**: Value > 10 indicates high risk of read/write failure.
- **Attribute 197 (Current Pending Sector Count)**: Non-zero values indicate unstable sectors.
- **Attribute 198 (Offline Uncorrectable Sector Count)**: Indicates direct physical disk wear.

## 3. Symptoms of HDD Failure
- Slow boot times, failure to load recorded assets, system freezes during live TV timeshifting, high audible noise.
- System error logs showing direct I/O read timeouts.
