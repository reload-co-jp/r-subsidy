import type {
  NormalizedSubsidy,
  UserProfile,
  ScoringResult,
  ScoreBreakdown,
  Tier,
} from './types'

const WEIGHTS = {
  region: { national: 10, tokyoMatch: 30, prefectureMatch: 25, mismatch: 0 },
  industry: { noRestriction: 15, match: 25, mismatch: 0 },
  employee: { noRestriction: 10, match: 20, mismatch: 0 },
  purpose: { perMatch: 5, max: 15 },
  status: { open: 10, upcoming: 5, closed: 0, unknown: 3 },
  tokyoBonus: 5,
}

export const TIER_THRESHOLDS: Record<Tier, number> = {
  strong: 65,
  match: 35,
  check: 0,
}

function scoreRegion(subsidy: NormalizedSubsidy, profile: UserProfile): number {
  if (subsidy.region === 'national') return WEIGHTS.region.national
  if (subsidy.region === 'tokyo') {
    return profile.prefecture === '東京都' ? WEIGHTS.region.tokyoMatch : WEIGHTS.region.mismatch
  }
  return subsidy.prefectures.includes(profile.prefecture)
    ? WEIGHTS.region.prefectureMatch
    : WEIGHTS.region.mismatch
}

function scoreIndustry(subsidy: NormalizedSubsidy, profile: UserProfile): number {
  if (subsidy.industries.length === 0) return WEIGHTS.industry.noRestriction
  return subsidy.industries.some(
    (ind) => ind.includes(profile.industry) || profile.industry.includes(ind)
  )
    ? WEIGHTS.industry.match
    : WEIGHTS.industry.mismatch
}

function scoreEmployee(subsidy: NormalizedSubsidy, profile: UserProfile): number {
  const { employeeMin, employeeMax } = subsidy
  if (employeeMin === null && employeeMax === null) return WEIGHTS.employee.noRestriction
  const count = profile.employeeCount
  const minOk = employeeMin === null || count >= employeeMin
  const maxOk = employeeMax === null || count <= employeeMax
  return minOk && maxOk ? WEIGHTS.employee.match : WEIGHTS.employee.mismatch
}

function scorePurpose(subsidy: NormalizedSubsidy, profile: UserProfile): number {
  const matches = subsidy.purposes.filter((p) => profile.purposes.includes(p)).length
  return Math.min(matches * WEIGHTS.purpose.perMatch, WEIGHTS.purpose.max)
}

function scoreStatus(subsidy: NormalizedSubsidy): number {
  return WEIGHTS.status[subsidy.status]
}

function scoreTokyoBonus(subsidy: NormalizedSubsidy, profile: UserProfile): number {
  return subsidy.source === 'tokyo' && profile.prefecture === '東京都' ? WEIGHTS.tokyoBonus : 0
}

export function determineTier(score: number): Tier {
  if (score >= TIER_THRESHOLDS.strong) return 'strong'
  if (score >= TIER_THRESHOLDS.match) return 'match'
  return 'check'
}

export function scoreSubsidy(subsidy: NormalizedSubsidy, profile: UserProfile): ScoringResult {
  const breakdown: ScoreBreakdown = {
    region: scoreRegion(subsidy, profile),
    industry: scoreIndustry(subsidy, profile),
    employee: scoreEmployee(subsidy, profile),
    purpose: scorePurpose(subsidy, profile),
    status: scoreStatus(subsidy),
    tokyoBonus: scoreTokyoBonus(subsidy, profile),
  }

  const score = Object.values(breakdown).reduce((a, b) => a + b, 0)

  return {
    subsidy,
    score,
    tier: determineTier(score),
    breakdown,
  }
}

export function scoreAndSort(
  subsidies: NormalizedSubsidy[],
  profile: UserProfile
): ScoringResult[] {
  return subsidies
    .map((s) => scoreSubsidy(s, profile))
    .sort((a, b) => b.score - a.score)
}
