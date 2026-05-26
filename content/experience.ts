import experienceData from '@/data/experience.json';
import type { ExperienceRow } from './types';

export const EXPERIENCE: ExperienceRow[] = (
  experienceData as { rows: ExperienceRow[] }
).rows;
