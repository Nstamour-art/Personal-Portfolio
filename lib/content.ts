import { PROJECTS } from '@/content/projects';
import { NOTES } from '@/content/notes';
import { DISCIPLINES } from '@/content/disciplines';
import type { DisciplineId, Note, Project } from '@/content/types';

/* ─── Projects ─────────────────────────────────────────────────────────── */

export function getProject(id: string): Project | undefined {
  return PROJECTS.find((p) => p.id === id);
}

export function getProjectIndex(id: string): number {
  return PROJECTS.findIndex((p) => p.id === id);
}

export function getNextProject(id: string): Project {
  const i = getProjectIndex(id);
  if (i === -1) return PROJECTS[0]!;
  return PROJECTS[(i + 1) % PROJECTS.length]!;
}

export function getPrevProject(id: string): Project {
  const i = getProjectIndex(id);
  if (i === -1) return PROJECTS[PROJECTS.length - 1]!;
  return PROJECTS[(i - 1 + PROJECTS.length) % PROJECTS.length]!;
}

export function getProjectsBy(disciplineId: DisciplineId | 'all'): Project[] {
  if (!disciplineId || disciplineId === 'all') return PROJECTS;
  return PROJECTS.filter((p) => p.disciplines.includes(disciplineId));
}

/**
 * Featured is single-select. If none is featured, fall back to the first
 * project so the home page never empties.
 */
export function getFeatured(): Project {
  const marked = PROJECTS.find((p) => p.featured === true);
  return marked ?? PROJECTS[0]!;
}

/* ─── Notes ────────────────────────────────────────────────────────────── */

export function getNote(id: string): Note | undefined {
  return NOTES.find((n) => n.id === id);
}

/** Pinned-first, then file order. No automatic recency sort — see SPEC §6.8. */
export function getSortedNotes(): Note[] {
  const pinned = NOTES.filter((n) => n.pinned);
  const rest = NOTES.filter((n) => !n.pinned);
  return [...pinned, ...rest];
}

export function getNextNote(id: string): Note {
  const list = getSortedNotes();
  const i = list.findIndex((n) => n.id === id);
  if (i === -1) return list[0]!;
  return list[(i + 1) % list.length]!;
}

export function getPrevNote(id: string): Note {
  const list = getSortedNotes();
  const i = list.findIndex((n) => n.id === id);
  if (i === -1) return list[list.length - 1]!;
  return list[(i - 1 + list.length) % list.length]!;
}

/** Reading time estimate, in whole minutes. SPEC §6.9. */
export function getReadingTime(body: string): number {
  const words = body.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

/* ─── Derived metadata ─────────────────────────────────────────────────── */

/** Returns { min, max } year numbers across all projects, or null. */
export function getYearRange(): { min: number; max: number } | null {
  const years: number[] = [];
  for (const p of PROJECTS) {
    if (!p.year) continue;
    const matches = String(p.year).match(/\d{4}/g);
    if (matches) for (const y of matches) years.push(parseInt(y, 10));
  }
  if (!years.length) return null;
  return { min: Math.min(...years), max: Math.max(...years) };
}

/** Unique discipline ids actually used across projects. */
export function getDisciplineCount(): number {
  const used = new Set<DisciplineId>();
  for (const p of PROJECTS) for (const d of p.disciplines) used.add(d);
  return used.size;
}

export function getDisciplineLabel(id: DisciplineId | 'all'): string {
  return DISCIPLINES.find((d) => d.id === id)?.label ?? id;
}

/** How many projects match the given discipline (or 'all'). */
export function countProjectsForDiscipline(id: DisciplineId | 'all'): number {
  return getProjectsBy(id).length;
}
