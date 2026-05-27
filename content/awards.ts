import awardsData from '@/data/awards.json';
import type { AwardRow } from './types';

export const AWARDS: AwardRow[] = (awardsData as { rows: AwardRow[] }).rows;
