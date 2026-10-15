import type { Tier } from "../../lib/types"

export const INDUSTRIES = [
  "製造業",
  "建設業",
  "小売業",
  "卸売業",
  "飲食業",
  "宿泊業",
  "情報通信業",
  "サービス業",
  "医療・福祉",
  "農業・林業・漁業",
  "不動産業",
  "教育・学習支援業",
  "その他",
]

export const PURPOSES = [
  "設備投資",
  "人材育成",
  "販路拡大",
  "研究開発",
  "事業承継",
  "創業",
  "省エネ",
  "デジタル化",
]

export const TIER_CONFIG: Record<Tier, { label: string; color: string; bg: string; border: string }> = {
  strong: { label: "強くおすすめ", color: "var(--navy)", bg: "var(--navy-50)", border: "#c9d4e3" },
  match: { label: "条件一致", color: "var(--green-dark)", bg: "var(--green-50)", border: "var(--green-200)" },
  check: { label: "要確認", color: "var(--text-muted)", bg: "var(--bg-surface-alt)", border: "var(--border-strong)" },
}

export const STORAGE_KEY = "diagnosis-profile"
