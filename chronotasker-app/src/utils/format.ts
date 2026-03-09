// 12 hues, 30° apart starting at 15°, avoids pure primaries which can look garish.
// Any two tags that land on different slots are guaranteed ≥30° apart.
const TAG_HUES = [15, 45, 75, 105, 135, 165, 195, 225, 255, 285, 315, 345];

/** Deterministic hue from a tag string. Same tag always returns the same hue;
 *  different tags are distributed across 12 evenly-spaced hue slots. */
export function tagHue(tag: string): number {
  let hash = 0;
  for (let i = 0; i < tag.length; i++) {
    hash = tag.charCodeAt(i) + ((hash << 5) - hash);
  }
  return TAG_HUES[Math.abs(hash) % TAG_HUES.length];
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
