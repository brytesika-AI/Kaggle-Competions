# Ibis-4K Decoder Hardware Reference

## 1. Specifications
- **CPU**: Quad-core ARM Cortex-A72 @ 1.8 GHz (Broadcom BCM7278 equivalent)
- **RAM**: 4GB LPDDR4
- **Security Engine**: Secure Core with One-Time Programmable (OTP) security cell keys.
- **Conditional Access**: Irdeto Cloaked CA (embedded).

## 2. Secure Core Authentication and OTP
The Ibis-4K utilizes a hardware secure element to authenticate smartcard entitlements.
- During conditional access updates, the system queries the secure element OTP registers.
- If the Ibis-4K is running firmware version `v3.1.0`, it may encounter high read request volume on the secure bus.
- **SEC-E0311** is logged when a read error occurs.
- If the error code includes `Flag=0`, it is a transient read timeout and is retried.
- If `Flag=1`, it represents a critical hardware integrity fault or unrecoverable signature check failure, resulting in channel decryption failure.

## 3. Troubleshooting
- Reset smartcard.
- Check voltage supply to the CA card slot.
