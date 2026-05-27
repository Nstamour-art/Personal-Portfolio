import type { Discipline } from './types';

export const DISCIPLINES: Discipline[] = [
  { id: 'all', label: 'Everything' },
  { id: 'motion', label: 'Motion' },
  { id: '3d', label: '3D / CG' },
  { id: 'illo', label: 'Illustration' },
  { id: 'video', label: 'Video' },
  { id: 'ai', label: 'AI / Workflows' },
  { id: 'code', label: 'Code' },
];

/* `cursorLabel` is what appears in the cursor pill on hover. Kept
 * alongside the NAV data so the rail and the footer use the same
 * voice automatically — second-person, casual, a little playful, in
 * line with the brand mark's "Take me home" and the footer's
 * "Say hi". Edit any one of these in this file and both spots
 * update. */
export const NAV = [
  { id: 'index', label: 'Index', path: '/', cursorLabel: 'From the top' },
  { id: 'work', label: 'Work', path: '/work', cursorLabel: 'The good stuff' },
  { id: 'notes', label: 'Notes', path: '/notes', cursorLabel: 'Read along' },
  { id: 'about', label: 'Studio', path: '/studio', cursorLabel: 'Meet me' },
  { id: 'contact', label: 'Contact', path: '/contact', cursorLabel: 'Drop a line' },
] as const;

export type NavId = (typeof NAV)[number]['id'];
