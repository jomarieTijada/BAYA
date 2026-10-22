export type CloudConfig = { url: string; key: string };

/** Only public project credentials belong in an Expo bundle. */
export function readCloudConfig(url?: string, key?: string): CloudConfig | null {
  if (!url?.trim() || !key?.trim()) return null;
  const parsed = new URL(url.trim());
  if (parsed.protocol !== 'https:' || parsed.username || parsed.password || parsed.pathname !== '/') {
    throw new Error('Use the HTTPS Supabase project URL.');
  }
  const publicKey = key.trim();
  if (!publicKey.startsWith('sb_publishable_')) {
    // Legacy anon JWTs are still supported. Never accept a service-role JWT.
    try {
      const segment = publicKey.split('.')[1];
      const payload = JSON.parse(atob(segment.replace(/-/g, '+').replace(/_/g, '/'))) as { role?: string };
      if (payload.role !== 'anon') throw new Error();
    } catch { throw new Error('Use a public publishable or anon key.'); }
  }
  return { url: parsed.origin, key: publicKey };
}
