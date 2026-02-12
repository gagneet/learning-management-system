import type { AgeTierId } from '@/contexts/ThemeContext';

export interface AgeTier {
  id: AgeTierId;
  name: string;
  ageRange: string;
  navigationStyle: 'icon-only' | 'icon-text' | 'full-nav';
  textDensity: 'minimal' | 'moderate' | 'standard';
  visualStyle: 'playful' | 'structured' | 'professional';
  contentLayout: 'single' | 'sequential' | 'multi-panel';
  feedbackStyle: 'animated' | 'visual-audio' | 'subtle';
  interactionMode: 'simple' | 'guided' | 'advanced';
}

export const AGE_TIERS: Record<AgeTierId, AgeTier> = {
  tier1: {
    id: 'tier1',
    name: 'Young Learners',
    ageRange: '5-8 years',
    navigationStyle: 'icon-only',
    textDensity: 'minimal',
    visualStyle: 'playful',
    contentLayout: 'single',
    feedbackStyle: 'animated',
    interactionMode: 'simple',
  },
  tier2: {
    id: 'tier2',
    name: 'Middle Years',
    ageRange: '9-13 years',
    navigationStyle: 'icon-text',
    textDensity: 'moderate',
    visualStyle: 'structured',
    contentLayout: 'sequential',
    feedbackStyle: 'visual-audio',
    interactionMode: 'guided',
  },
  tier3: {
    id: 'tier3',
    name: 'Teens & Adults',
    ageRange: '14+ years',
    navigationStyle: 'full-nav',
    textDensity: 'standard',
    visualStyle: 'professional',
    contentLayout: 'multi-panel',
    feedbackStyle: 'subtle',
    interactionMode: 'advanced',
  },
};

export function getAgeTierFromAge(age: number): AgeTierId {
  if (age >= 5 && age <= 8) return 'tier1';
  if (age >= 9 && age <= 13) return 'tier2';
  return 'tier3';
}

export function getAgeTierFromDateOfBirth(dob: Date): AgeTierId {
  const age = Math.floor((Date.now() - dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
  return getAgeTierFromAge(age);
}

export function calculateAge(dob: Date): number {
  return Math.floor((Date.now() - dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
}
