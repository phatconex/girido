export type GiriMood = 'happy' | 'cheer' | 'sleepy' | 'sad' | 'munch';
export interface LiveJar { add(level: number): void; setLast(level: number): void; count(): number }

declare const Giri: {
  mascot(mood: GiriMood, size?: number): string;
  plant(stage: number, kind: string, size?: number, bare?: boolean): string;
  plot(days: (string | null)[], opts?: { today?: number; fresh?: number; size?: number }): string;
  trail(months: { key?: string; name: string; days: (string | null)[] }[], opts?: { per?: number; size?: number }): string;
  groups: { key: string; name: string; kinds: string[] }[];
  orb(level: number, size?: number): string;
  jar(levels: number[], size?: number, dropLast?: boolean): string;
  jarLive(el: HTMLElement, levels: number[], size?: number): LiveJar;
  burst(el: Element, kind: 'drops' | 'confetti'): void;
  rain(el: Element | null): void;
  stages: string[];
  kinds: Record<string, string>;
  moods: Record<GiriMood, string>;
  feelings: string[];
};
export default Giri;
