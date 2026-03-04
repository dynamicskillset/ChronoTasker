/** Deterministic hue from a tag string */
export function tagHue(tag: string): number {
  let hash = 0;
  for (let i = 0; i < tag.length; i++) {
    hash = tag.charCodeAt(i) + ((hash << 5) - hash);
  }
  return ((hash % 360) + 360) % 360;
}

export function tagColor(tag: string): string {
  return `hsl(${tagHue(tag)}, var(--tag-saturation, 55%), var(--tag-text-lightness, 40%))`;
}

export function tagBgColor(tag: string): string {
  return `hsl(${tagHue(tag)}, var(--tag-saturation, 55%), var(--tag-bg-lightness, 92%))`;
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
}
