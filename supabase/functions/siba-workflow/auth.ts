// Compare the credential itself, not unverified claims from a JWT payload.
// Hash first so the comparison does not disclose a matching token prefix.
export async function authorizeWorkflow(
  authorization: string | null,
  serviceRoleKey: string | undefined,
): Promise<boolean> {
  if (!serviceRoleKey || !authorization || authorization.length > 8192) return false;
  const match = /^Bearer ([^\s]+)$/i.exec(authorization);
  if (!match) return false;
  const encoder = new TextEncoder();
  const [actual, expected] = await Promise.all([
    crypto.subtle.digest('SHA-256', encoder.encode(match[1])),
    crypto.subtle.digest('SHA-256', encoder.encode(serviceRoleKey)),
  ]);
  const actualBytes = new Uint8Array(actual);
  const expectedBytes = new Uint8Array(expected);
  let difference = 0;
  for (let index = 0; index < actualBytes.length; index++) {
    difference |= actualBytes[index] ^ expectedBytes[index];
  }
  return difference === 0;
}
