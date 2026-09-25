import fs from "fs"
import path from "path"
import type { SubsidyIndexItem } from "./types"
import { todayJst } from "./quality"
import { formatAmount } from "./format"

// 一覧系ページをindexする最低掲載件数（受付中+公募前）。未満は noindex,follow & sitemap除外
export const MIN_INDEX_COUNT = 5

// 日付系はビルド時点で計算（静的書き出しのため、定期ビルドで更新される）
export const TODAY = todayJst()
export const CURRENT_YEAR = Number(TODAY.slice(0, 4))
const fiscalYear = Number(TODAY.slice(5, 7)) >= 4 ? CURRENT_YEAR : CURRENT_YEAR - 1
export const YEAR_LABEL = `${CURRENT_YEAR}年（令和${fiscalYear - 2018}年度）`

const PURPOSE_LABELS: Record<string, string> = { デジタル化: "IT・DX" }
export const purposeLabel = (purpose: string) => PURPOSE_LABELS[purpose] ?? purpose

export function loadSubsidyIndex(): SubsidyIndexItem[] {
  try {
    const file = path.join(process.cwd(), "data", "generated", "subsidies-index.json")
    return JSON.parse(fs.readFileSync(file, "utf-8"))
  } catch {
    return []
  }
}

export const isActive = (s: SubsidyIndexItem) => s.status !== "closed"

// 全国制度を除いた、その都道府県固有の制度か
export function isLocalTo(s: SubsidyIndexItem, prefecture: string) {
  return s.region !== "national" && !s.prefectures.includes("全国") && s.prefectures.includes(prefecture)
}

export function indexRobots(activeCount: number) {
  return activeCount >= MIN_INDEX_COUNT ? undefined : { index: false, follow: true }
}

export function latestUpdatedAt(subsidies: SubsidyIndexItem[]) {
  return subsidies.reduce((latest, s) => (s.updatedAt > latest ? s.updatedAt : latest), "")
}

export function areaLabel(s: { region: string; prefectures: string[] }) {
  if (s.region === "national" || s.prefectures.includes("全国") || s.prefectures.length === 0) return "全国"
  return s.prefectures.length > 3 ? `${s.prefectures.slice(0, 3).join("・")}ほか` : s.prefectures.join("・")
}

export function subsidyTitle(s: { title: string; region: string; prefectures: string[]; upperLimit: string | null }) {
  const amount = s.upperLimit && s.upperLimit !== "0円" ? formatAmount(s.upperLimit) : null
  return `${s.title}｜${areaLabel(s)}${amount ? `・上限${amount}` : ""}`
}

function addDays(date: string, days: number) {
  const d = new Date(`${date}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

export function getDeadlineGroups(subsidies: SubsidyIndexItem[], today = TODAY) {
  const open = subsidies
    .filter((s) => s.status === "open" && s.endDate && s.endDate.slice(0, 10) >= today)
    .toSorted((a, b) => a.endDate!.localeCompare(b.endDate!))
  const dayOfWeek = new Date(`${today}T00:00:00Z`).getUTCDay()
  const weekEnd = addDays(today, (7 - dayOfWeek) % 7) // 今週日曜まで
  const monthEnd = `${today.slice(0, 7)}-31`
  const soonEnd = addDays(today, 30)
  const until = (end: string) => open.filter((s) => s.endDate!.slice(0, 10) <= end)
  return { thisWeek: until(weekEnd), thisMonth: until(monthEnd), soon: until(soonEnd) }
}

// 都道府県×用途ページ: その都道府県固有の制度（受付中+公募前）で用途ごとの件数
export function getPrefecturePurposes(subsidies: SubsidyIndexItem[], prefecture: string) {
  const counts = new Map<string, number>()
  for (const s of subsidies) {
    if (!isActive(s) || !isLocalTo(s, prefecture)) continue
    for (const p of s.purposes) counts.set(p, (counts.get(p) ?? 0) + 1)
  }
  return [...counts].map(([purpose, count]) => ({ purpose, count })).toSorted((a, b) => b.count - a.count)
}
