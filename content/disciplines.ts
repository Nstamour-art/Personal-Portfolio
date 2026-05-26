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

export const NAV = [
  { id: 'index', label: 'Index', path: '/' },
  { id: 'work', label: 'Work', path: '/work' },
  { id: 'notes', label: 'Notes', path: '/notes' },
  { id: 'about', label: 'Studio', path: '/studio' },
  { id: 'contact', label: 'Contact', path: '/contact' },
] as const;

export type NavId = (typeof NAV)[number]['id'];
