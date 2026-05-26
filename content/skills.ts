import skillsData from '@/data/skills.json';
import type { SkillGroup } from './types';

export const SKILLS: SkillGroup[] = (
  skillsData as { groups: SkillGroup[] }
).groups;
