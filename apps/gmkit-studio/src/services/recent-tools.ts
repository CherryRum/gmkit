const RECENT_KEY = 'gmkit_recent_tools_v5';
const MAX_RECENT = 8;

export function readRecentToolIds(): string[] {
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((value): value is string => typeof value === 'string') : [];
  } catch {
    return [];
  }
}

export function saveRecentToolId(id: string): void {
  const next = [id, ...readRecentToolIds().filter((item) => item !== id)].slice(0, MAX_RECENT);
  localStorage.setItem(RECENT_KEY, JSON.stringify(next));
}

export function clearRecentToolIds(): void {
  localStorage.removeItem(RECENT_KEY);
}
