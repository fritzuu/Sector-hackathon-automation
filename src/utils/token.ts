export function generateSecurePairingToken(): string {
  const chars = 'abcdef0123456789';
  let token = 'siba_live_';
  for (let i = 0; i < 24; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token; // 34 characters total (e.g. siba_live_a1b2c3d4e5f6789012345678)
}
