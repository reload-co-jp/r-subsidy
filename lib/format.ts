export function formatDate(date: string | null): string | null {
  if (!date) return null
  const m = date.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (!m) return date
  return `${m[1]}年${m[2]}月${m[3]}日`
}

export function parseAmount(value: string | null): number | null {
  if (!value || value === "0円") return null
  const m = value.match(/^([\d,]+)円$/)
  if (!m) return null
  const n = parseInt(m[1].replace(/,/g, ""), 10)
  return isNaN(n) ? null : n
}

export function formatAmount(value: string | null): string | null {
  if (!value) return null
  const m = value.match(/^([\d,]+)円$/)
  if (!m) return value
  const num = parseInt(m[1].replace(/,/g, ""), 10)
  if (isNaN(num) || num === 0) return value
  const oku = Math.floor(num / 100_000_000)
  const man = Math.floor((num % 100_000_000) / 10_000)
  if (oku > 0 && man > 0) return `${oku}億${man}万円`
  if (oku > 0) return `${oku}億円`
  if (man > 0) return `${man}万円`
  return `${num}円`
}

export function areaLabel(s: { region: string; prefectures: string[] }) {
  if (s.region === "national" || s.prefectures.includes("全国") || s.prefectures.length === 0) return "全国"
  return s.prefectures.length > 3 ? `${s.prefectures.slice(0, 3).join("・")}ほか` : s.prefectures.join("・")
}

const PURPOSE_LABELS: Record<string, string> = { デジタル化: "IT・DX" }
export const purposeLabel = (purpose: string) => PURPOSE_LABELS[purpose] ?? purpose

// 公的APIで構造化されていない取得元は、概要が一定量ある制度だけ検索エンジンに登録する（薄いページを増やさない）
const STRUCTURED_SOURCES = new Set(["jgrants", "manual"])
export const MIN_INDEX_OVERVIEW_LENGTH = 60
export function isIndexableSubsidy(s: { status: string; source: string; overview: string }) {
  if (s.status === "closed") return false
  return STRUCTURED_SOURCES.has(s.source) || s.overview.trim().length >= MIN_INDEX_OVERVIEW_LENGTH
}
