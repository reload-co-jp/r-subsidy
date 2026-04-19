import type { JGrantsDetail, NormalizedSubsidy, Region, Status } from './types'

const TOKYO_PREFECTURES = ['東京都', '東京']

const PURPOSE_KEYWORDS: Record<string, string[]> = {
  設備投資: ['設備', '機械', '装置', '導入', '購入', 'IT', 'デジタル', 'DX'],
  人材育成: ['人材', '雇用', '採用', '教育', '訓練', 'スキル'],
  販路拡大: ['販路', '海外', '輸出', 'EC', '広告', 'マーケティング'],
  研究開発: ['研究', '開発', 'R&D', '技術', '実証', '試作'],
  事業承継: ['事業承継', '後継', '引継', '承継'],
  創業: ['創業', '開業', 'スタートアップ', '起業', '新規'],
  省エネ: ['省エネ', 'エネルギー', '再生可能', '脱炭素', 'CO2', 'カーボン'],
  デジタル化: ['デジタル', 'DX', 'IT', 'システム', 'クラウド', 'AI'],
}

export function extractPurposes(text: string): string[] {
  const found: string[] = []
  for (const [purpose, keywords] of Object.entries(PURPOSE_KEYWORDS)) {
    if (keywords.some((kw) => text.includes(kw))) {
      found.push(purpose)
    }
  }
  return [...new Set(found)]
}

export function normalizeRegion(prefectures: string[]): Region {
  if (!prefectures || prefectures.length === 0) return 'national'
  if (prefectures.length >= 47) return 'national'
  if (prefectures.some((p) => TOKYO_PREFECTURES.includes(p))) {
    return prefectures.length === 1 ? 'tokyo' : 'prefecture'
  }
  return 'prefecture'
}

export function normalizeStatus(
  acceptanceStatus: string | undefined,
  startDate: string | null,
  endDate: string | null
): Status {
  if (acceptanceStatus) {
    const s = acceptanceStatus.toLowerCase()
    if (s === 'open' || s === '受付中') return 'open'
    if (s === 'upcoming' || s === '準備中' || s === '公募前') return 'upcoming'
    if (s === 'closed' || s === '終了' || s === '受付終了') return 'closed'
  }

  const now = new Date()
  if (startDate && endDate) {
    const start = parseJGrantsDate(startDate)
    const end = parseJGrantsDate(endDate)
    if (start && end) {
      if (now < start) return 'upcoming'
      if (now > end) return 'closed'
      return 'open'
    }
  }

  return 'unknown'
}

export function parseJGrantsDate(dateStr: string | undefined | null): Date | null {
  if (!dateStr) return null
  const clean = dateStr.replace(/[^0-9]/g, '')
  if (clean.length === 8) {
    const y = clean.slice(0, 4)
    const m = clean.slice(4, 6)
    const d = clean.slice(6, 8)
    return new Date(`${y}-${m}-${d}`)
  }
  const d = new Date(dateStr)
  return isNaN(d.getTime()) ? null : d
}

export function formatDate(date: Date | null): string | null {
  if (!date) return null
  return date.toISOString().split('T')[0]
}

export function normalizeEmployeeCount(str: string | undefined): {
  min: number | null
  max: number | null
} {
  if (!str) return { min: null, max: null }

  const patterns: [RegExp, (m: RegExpMatchArray) => { min: number | null; max: number | null }][] =
    [
      [/(\d+)人以下/, (m) => ({ min: null, max: parseInt(m[1]) })],
      [/(\d+)名以下/, (m) => ({ min: null, max: parseInt(m[1]) })],
      [/(\d+)人未満/, (m) => ({ min: null, max: parseInt(m[1]) - 1 })],
      [/(\d+)人以上/, (m) => ({ min: parseInt(m[1]), max: null })],
      [/(\d+)～(\d+)人/, (m) => ({ min: parseInt(m[1]), max: parseInt(m[2]) })],
      [/(\d+)-(\d+)人/, (m) => ({ min: parseInt(m[1]), max: parseInt(m[2]) })],
      [/(\d+)人/, (m) => ({ min: null, max: parseInt(m[1]) })],
    ]

  for (const [regex, handler] of patterns) {
    const match = str.match(regex)
    if (match) return handler(match)
  }

  return { min: null, max: null }
}

export function normalizeIndustries(industryTypes: string[] | undefined): string[] {
  if (!industryTypes || industryTypes.length === 0) return []
  return industryTypes.map((t) => t.trim()).filter(Boolean)
}

export function toSlug(id: string): string {
  return id.replace(/[^a-zA-Z0-9-_]/g, '-').toLowerCase()
}

export function normalizeJGrantsDetail(detail: JGrantsDetail): NormalizedSubsidy {
  const prefectures = detail.target?.prefecture ?? []
  const region = normalizeRegion(prefectures)

  const period = detail.acceptance_period_list?.[0]
  const startDate = formatDate(parseJGrantsDate(period?.start_date ?? detail.subsidy_detail?.reference_url))
  const endDate = formatDate(parseJGrantsDate(period?.end_date))

  const status = normalizeStatus(detail.acceptance_status, startDate, endDate)

  const overview = detail.subsidy_detail?.overview ?? detail.subtitle ?? ''
  const fullText = `${detail.title} ${overview} ${detail.subsidy_detail?.detail ?? ''}`
  const purposes = extractPurposes(fullText)

  const empStr = detail.target?.target_number_of_employees
  const { min: employeeMin, max: employeeMax } = normalizeEmployeeCount(empStr)

  return {
    id: detail.id,
    slug: toSlug(detail.id),
    title: detail.title,
    overview,
    detail: detail.subsidy_detail?.detail ?? '',
    region,
    prefectures,
    industries: normalizeIndustries(detail.target?.industry_type),
    employeeMin,
    employeeMax,
    purposes,
    status,
    workflow: period?.workflow ?? null,
    subsidizedRate: detail.subsidy_detail?.subsidized_rate ?? null,
    upperLimit: detail.subsidy_detail?.upper_limit ?? null,
    lowerLimit: detail.subsidy_detail?.lower_limit ?? null,
    startDate: formatDate(parseJGrantsDate(period?.start_date)),
    endDate: formatDate(parseJGrantsDate(period?.end_date)),
    source: 'jgrants',
    referenceUrl: detail.subsidy_detail?.reference_url ?? null,
    updatedAt: detail.updated_date ?? new Date().toISOString(),
  }
}
