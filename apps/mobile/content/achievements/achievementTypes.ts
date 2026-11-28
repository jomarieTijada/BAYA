export type CharacterGroup = 'vowel' | 'base-consonant' | 'foundation' | 'upper-kudlit' | 'lower-kudlit';
export type AchievementMetric = 'recordings' | 'pairs' | 'boardCorrect' | 'audioQuestions' | 'decodeQuestions' | 'buildQuestions' | 'perfectBoard' | 'writingAttempts' | 'writingSuccess' | 'writingQuestions' | 'baseTargets' | 'upperTargets' | 'lowerTargets' | 'checkpoints' | 'allCheckpoints' | 'retry' | 'improvement' | 'resume' | 'story' | 'replay' | 'offline' | 'values';
export type AchievementCondition = { type: 'topics'; ids: string[]; minimum?: number } | { type: 'module'; id: string } | { type: 'exploration'; group: CharacterGroup; minimum: number } | { type: 'metric'; metric: AchievementMetric; minimum: number };
export type AchievementDefinition = {
 id: string; catalogNumber: number; title: { en: string; tl: string }; description: { en: string; tl: string }; requirement: { en: string; tl: string };
 category: 'learning-journey' | 'baybayin-discovery' | 'listening-matching' | 'handwriting' | 'milestones-adventures';
 iconKey: string; condition: AchievementCondition; starValue: number | null; proposedStars: number; sortOrder: number;
 availability: 'available' | 'coming-soon' | 'pending-validation'; definitionVersion: number;
};
export type AchievementState = { definition: AchievementDefinition; grantedStars?:number; current: number; target: number; unlockedAt: string | null; availability: AchievementDefinition['availability'] };
