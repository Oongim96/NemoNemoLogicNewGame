/** `mult=80;buff_atk_pct=15` → Record */
export function parseEffectParams(raw?: string): Record<string, string> {
  if (!raw) return {};
  const out: Record<string, string> = {};
  for (const part of raw.split(';')) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) {
      out[trimmed] = 'true';
    } else {
      out[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim();
    }
  }
  return out;
}

export function paramNumber(params: Record<string, string>, key: string, fallback: number): number {
  const v = params[key];
  if (v === undefined) return fallback;
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

export function paramBool(params: Record<string, string>, key: string): boolean {
  const v = params[key];
  return v === 'true' || v === '1';
}
