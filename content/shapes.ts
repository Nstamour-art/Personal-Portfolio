/**
 * Floating shape descriptors layered onto procedural placeholders for extra
 * visual variety. Indexed by project id. Pure CSS shapes — auto-removed once
 * the project has a real hero image.
 */

export interface ShapeDescriptor {
  type: 'circle' | 'rect';
  w: number;
  h: number;
  x: string;
  y: string;
  bg: string;
  opacity: number;
  rotate?: number;
  blur?: number;
}

export const SHAPES: Record<string, ShapeDescriptor[]> = {
  vubiquity: [
    { type: 'circle', w: 220, h: 220, x: '20%', y: '30%', bg: 'var(--accent)', opacity: 0.5, blur: 40 },
    { type: 'circle', w: 140, h: 140, x: '62%', y: '55%', bg: '#4f7cff', opacity: 0.3, blur: 60 },
  ],
  multiculturalism: [
    {
      type: 'rect',
      w: 180,
      h: 180,
      x: '30%',
      y: '30%',
      bg: 'linear-gradient(135deg, var(--accent), #4f7cff)',
      opacity: 0.45,
      rotate: 12,
      blur: 14,
    },
    { type: 'circle', w: 90, h: 90, x: '65%', y: '65%', bg: 'var(--accent)', opacity: 0.55, blur: 12 },
  ],
  xogot: [
    { type: 'rect', w: 240, h: 36, x: '20%', y: '40%', bg: 'var(--accent)', opacity: 0.6, rotate: -8, blur: 0 },
    { type: 'rect', w: 160, h: 24, x: '44%', y: '60%', bg: '#4f7cff', opacity: 0.4, rotate: -8, blur: 0 },
    { type: 'circle', w: 50, h: 50, x: '70%', y: '30%', bg: 'var(--accent)', opacity: 0.5, blur: 8 },
  ],
  weave: [
    {
      type: 'circle',
      w: 320,
      h: 320,
      x: '30%',
      y: '30%',
      bg: 'radial-gradient(circle, var(--accent), transparent 70%)',
      opacity: 0.5,
      blur: 0,
    },
    { type: 'circle', w: 120, h: 120, x: '60%', y: '60%', bg: 'var(--accent)', opacity: 0.3, blur: 30 },
  ],
  bigbake: [
    {
      type: 'circle',
      w: 280,
      h: 280,
      x: '60%',
      y: '40%',
      bg: 'radial-gradient(circle, #ffb340, transparent 65%)',
      opacity: 0.4,
      blur: 0,
    },
    { type: 'rect', w: 90, h: 90, x: '20%', y: '55%', bg: '#ffb340', opacity: 0.45, rotate: 22, blur: 10 },
  ],
  underwriter: [
    { type: 'rect', w: 220, h: 1, x: '50%', y: '30%', bg: 'var(--accent)', opacity: 0.6, blur: 0 },
    { type: 'rect', w: 220, h: 1, x: '50%', y: '50%', bg: 'var(--accent)', opacity: 0.4, blur: 0 },
    { type: 'rect', w: 220, h: 1, x: '50%', y: '70%', bg: 'var(--accent)', opacity: 0.25, blur: 0 },
    { type: 'circle', w: 12, h: 12, x: '50%', y: '30%', bg: 'var(--accent)', opacity: 0.9, blur: 0 },
  ],
  reels: [
    {
      type: 'rect',
      w: 160,
      h: 100,
      x: '32%',
      y: '40%',
      bg: 'linear-gradient(135deg, var(--accent), transparent)',
      opacity: 0.6,
      blur: 0,
    },
    {
      type: 'rect',
      w: 100,
      h: 60,
      x: '60%',
      y: '55%',
      bg: 'linear-gradient(135deg, #4f7cff, transparent)',
      opacity: 0.5,
      blur: 0,
    },
  ],
  modelling: [
    {
      type: 'circle',
      w: 200,
      h: 200,
      x: '50%',
      y: '50%',
      bg: 'conic-gradient(from 0deg, var(--accent), #4f7cff, var(--accent))',
      opacity: 0.5,
      blur: 30,
    },
  ],
};

/** Internal map — discipline id → CSS placeholder class. */
export const PH_BY_DISCIPLINE = {
  motion: 'ph-motion',
  '3d': 'ph-3d',
  illo: 'ph-illo',
  video: 'ph-video',
  ai: 'ph-ai',
  code: 'ph-code',
} as const;
