const requests = new Map<string, number[]>();
const WINDOW_MS = 60 * 1000;
const MAX_REQUESTS = 10;

export function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  let timestamps = requests.get(ip) ?? [];

  timestamps = timestamps.filter((t) => now - t < WINDOW_MS);

  if (timestamps.length >= MAX_REQUESTS) {
    return false;
  }

  timestamps.push(now);
  requests.set(ip, timestamps);
  return true;
}
