import { describe, expect, it } from 'vitest';
import { authorizeWorkflow } from '../supabase/functions/siba-workflow/auth.ts';

describe('workflow authentication', () => {
  const trusted = 'trusted-test-credential';
  it('accepts only the configured credential', async () => {
    expect(await authorizeWorkflow(`Bearer ${trusted}`, trusted)).toBe(true);
    expect(await authorizeWorkflow(`bearer ${trusted}`, trusted)).toBe(true);
  });
  it('rejects forged service_role claims and a different credential', async () => {
    const payload = Buffer.from(JSON.stringify({ role: 'service_role' })).toString('base64url');
    expect(await authorizeWorkflow(`Bearer e30.${payload}.forged`, trusted)).toBe(false);
    expect(await authorizeWorkflow(`Bearer ${trusted}x`, trusted)).toBe(false);
  });
  it('fails closed for absent configuration and malformed headers', async () => {
    for (const header of [null, '', trusted, `Basic ${trusted}`, `Bearer ${trusted} extra`]) {
      expect(await authorizeWorkflow(header, trusted)).toBe(false);
    }
    expect(await authorizeWorkflow(`Bearer ${trusted}`, undefined)).toBe(false);
  });
});
