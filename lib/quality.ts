import type { NormalizedSubsidy } from './types'

// 公開前のデータ品質チェック。不正データは公開JSON（=HTML）に出さない
const PLACEHOLDER_TITLE = /^※?\s*使用しない|^テスト|練習用|ダミー|令和[XＸ]年度/
const DATE_RE = /^\d{4}-\d{2}-\d{2}/
// 受付期間がこれ以上先の日付はデータ不備とみなす（例: 2124-03-31, 3026-07-09）
const MAX_YEARS_AHEAD = 10

export type QualityIssue = { slug: string; title: string; reason: string }

export function todayJst(now = new Date()) {
  return new Date(now.getTime() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10)
}

function cleanDate(value: string | null, today: string): string | null {
  if (!value || !DATE_RE.test(value) || isNaN(Date.parse(value.slice(0, 10)))) return null
  if (Number(value.slice(0, 4)) > Number(today.slice(0, 4)) + MAX_YEARS_AHEAD) return null
  return value
}

export function sanitizeSubsidies(subsidies: NormalizedSubsidy[], today = todayJst()) {
  const issues: QualityIssue[] = []
  const drop = (s: NormalizedSubsidy, reason: string) => {
    issues.push({ slug: s.slug, title: s.title, reason })
    return null
  }

  const cleaned = subsidies
    .map((s) => {
      const title = s.title?.trim() ?? ''
      if (!title) return drop(s, '空の制度名')
      if (PLACEHOLDER_TITLE.test(title)) return drop(s, 'placeholder/使用しないデータ')

      const startDate = cleanDate(s.startDate, today)
      const endDate = cleanDate(s.endDate, today)
      if (startDate !== s.startDate || endDate !== s.endDate) {
        issues.push({ slug: s.slug, title, reason: '不正または非現実的な日付を除去' })
      }
      const start = startDate?.slice(0, 10)
      const end = endDate?.slice(0, 10)
      if (start && end && start > end) return drop(s, '開始日 > 終了日')

      let status = s.status
      if (end && end < today && status !== 'closed') status = 'closed'
      else if (status === 'upcoming' && start && start <= today) status = 'open'
      else if (status === 'unknown' && start && end) status = start > today ? 'upcoming' : 'open'
      if (status !== s.status) {
        issues.push({ slug: s.slug, title, reason: `状態を補正 ${s.status}→${status}` })
      }

      return { ...s, title, startDate, endDate, status }
    })
    .filter((s): s is NormalizedSubsidy => s !== null)

  // 同名・同期間の重複は最新更新の1件だけ残す
  const byKey = new Map<string, NormalizedSubsidy>()
  for (const s of cleaned) {
    const key = `${s.title}|${s.startDate}|${s.endDate}`
    const prev = byKey.get(key)
    if (!prev) byKey.set(key, s)
    else {
      const [keep, dup] = s.updatedAt > prev.updatedAt ? [s, prev] : [prev, s]
      byKey.set(key, keep)
      drop(dup, `重複制度（${keep.slug}）`)
    }
  }

  return { subsidies: cleaned.filter((s) => byKey.get(`${s.title}|${s.startDate}|${s.endDate}`) === s), issues }
}
