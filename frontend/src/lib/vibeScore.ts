function overlapPct(a: string[], b: string[]): number {
  if (a.length === 0 && b.length === 0) return 0
  const setA = new Set(a)
  const common = b.filter(x => setA.has(x)).length
  const union = new Set([...a, ...b]).size
  return union === 0 ? 0 : common / union
}

export function computeVibeScore(
  myInterestIds: string[], myLanguageIds: string[], myServiceIds: string[],
  theirInterestIds: string[], theirLanguageIds: string[], theirServiceIds: string[]
): number {
  const iScore = overlapPct(myInterestIds, theirInterestIds)
  const lScore = overlapPct(myLanguageIds, theirLanguageIds)
  const sScore = overlapPct(myServiceIds, theirServiceIds)
  return Math.round(iScore * 50 + lScore * 30 + sScore * 20)
}

export function vibeScoreLabel(score: number): { emoji: string; color: string; bg: string } | null {
  if (score === 0) return null
  if (score >= 70) return { emoji: '🔥', color: '#236B63', bg: 'rgba(35,107,99,0.85)' }
  if (score >= 40) return { emoji: '✨', color: '#D9A45B', bg: 'rgba(217,164,91,0.85)' }
  return { emoji: '💚', color: '#4D9274', bg: 'rgba(77,146,116,0.75)' }
}
