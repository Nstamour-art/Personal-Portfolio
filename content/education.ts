import educationData from '@/data/education.json';
import type { EducationRow } from './types';

export const EDUCATION: EducationRow[] = (
  educationData as { rows: EducationRow[] }
).rows;
