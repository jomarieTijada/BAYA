export const rewardPolicy = {
  version: 1, earnings: {topic:2, module:5, matching:1, writing:1, checkpoint:3},
  hintCost:2, hintsEnabled: process.env.EXPO_PUBLIC_BAYA_UNASSISTED !== '1',
  twoStarThreshold:0.6,
} as const;
export function performanceRating(correct:number, scoreable:number) {
  if (!scoreable) return 0;
  if (correct === scoreable) return 3;
  return correct / scoreable >= rewardPolicy.twoStarThreshold ? 2 : 1;
}
