"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import type { SubsidyIndexItem } from "../../lib/types"

const statusLabel: Record<string, { label: string; color: string }> = {
  open: { label: "受付中", color: "#22c55e" },
  upcoming: { label: "公募前", color: "#f59e0b" },
  closed: { label: "終了", color: "#6b7280" },
  unknown: { label: "要確認", color: "#94a3b8" },
}

const regionLabel: Record<string, string> = {
  national: "全国",
  tokyo: "東京都",
  prefecture: "都道府県",
}

const PREFECTURES = [
  "北海道", "青森県", "岩手県", "宮城県", "秋田県", "山形県", "福島県",
  "茨城県", "栃木県", "群馬県", "埼玉県", "千葉県", "東京都", "神奈川県",
  "新潟県", "富山県", "石川県", "福井県", "山梨県", "長野県",
  "岐阜県", "静岡県", "愛知県", "三重県", "滋賀県", "京都府", "大阪府", "兵庫県",
  "奈良県", "和歌山県", "鳥取県", "島根県", "岡山県", "広島県", "山口県",
  "徳島県", "香川県", "愛媛県", "高知県", "福岡県", "佐賀県", "長崎県",
  "熊本県", "大分県", "宮崎県", "鹿児島県", "沖縄県",
]

const AREA_PREFECTURES: Record<string, string[]> = {
  "北海道地方": ["北海道"],
  "東北地方": ["青森県", "岩手県", "宮城県", "秋田県", "山形県", "福島県"],
  "関東・甲信越地方": [
    "茨城県", "栃木県", "群馬県", "埼玉県", "千葉県", "東京都", "神奈川県",
    "新潟県", "山梨県", "長野県",
  ],
  "東海・北陸地方": ["富山県", "石川県", "福井県", "岐阜県", "静岡県", "愛知県", "三重県"],
  "近畿地方": ["滋賀県", "京都府", "大阪府", "兵庫県", "奈良県", "和歌山県"],
  "中国地方": ["鳥取県", "島根県", "岡山県", "広島県", "山口県"],
  "四国地方": ["徳島県", "香川県", "愛媛県", "高知県"],
  "九州・沖縄地方": ["福岡県", "佐賀県", "長崎県", "熊本県", "大分県", "宮崎県", "鹿児島県", "沖縄県"],
}

function normalizeText(value: string) {
  return value.toLowerCase().replace(/\s+/g, "")
}

function buildSearchIndex(subsidy: SubsidyIndexItem) {
  const st = statusLabel[subsidy.status] ?? statusLabel.unknown
  const region = regionLabel[subsidy.region] ?? subsidy.region

  return normalizeText(
    [
      subsidy.title,
      region,
      st.label,
      ...subsidy.prefectures,
      ...subsidy.purposes,
      ...subsidy.industries,
      subsidy.upperLimit ?? "",
    ].join(" ")
  )
}

export default function SubsidiesListClient({
  subsidies,
}: {
  subsidies: SubsidyIndexItem[]
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [query, setQuery] = useState(() => searchParams.get("q") ?? "")
  const [statusFilter, setStatusFilter] = useState<"all" | SubsidyIndexItem["status"]>(() =>
    parseStatusFilter(searchParams.get("status"))
  )
  const [prefectureFilter, setPrefectureFilter] = useState(() =>
    parsePrefectureFilter(searchParams.get("prefecture"))
  )

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString())

    if (query) {
      params.set("q", query)
    } else {
      params.delete("q")
    }

    if (statusFilter !== "open") {
      params.set("status", statusFilter)
    } else {
      params.delete("status")
    }

    if (prefectureFilter !== "all") {
      params.set("prefecture", prefectureFilter)
    } else {
      params.delete("prefecture")
    }

    const nextUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname
    const currentUrl = searchParams.toString() ? `${pathname}?${searchParams.toString()}` : pathname

    if (nextUrl !== currentUrl) {
      router.replace(nextUrl, { scroll: false })
    }
  }, [pathname, prefectureFilter, query, router, searchParams, statusFilter])

  const filtered = useMemo(() => {
    const normalizedQuery = normalizeText(query)
    return subsidies.filter((subsidy) => {
      const matchesQuery = !normalizedQuery
        ? true
        : buildSearchIndex(subsidy).includes(normalizedQuery)
      const matchesStatus = statusFilter === "all" ? true : subsidy.status === statusFilter
      const matchesPrefecture =
        prefectureFilter === "all" ? true : matchesPrefectureFilter(subsidy, prefectureFilter)

      return matchesQuery && matchesStatus && matchesPrefecture
    })
  }, [query, prefectureFilter, statusFilter, subsidies])

  if (subsidies.length === 0) {
    return (
      <div
        style={{
          backgroundColor: "var(--bg-surface)",
          borderRadius: "8px",
          padding: "3rem",
          textAlign: "center",
          color: "var(--text-muted)",
        }}
      >
        <p style={{ marginBottom: "1rem" }}>補助金データがありません</p>
        <code
          style={{
            backgroundColor: "#0d1117",
            padding: ".5rem 1rem",
            borderRadius: "4px",
            fontSize: ".875rem",
            color: "#38b48b",
          }}
        >
          pnpm subsidies:update
        </code>
      </div>
    )
  }

  return (
    <div>
      <section
        style={{
          backgroundColor: "var(--bg-surface)",
          border: "1px solid var(--border-soft)",
          borderRadius: "10px",
          padding: "1rem",
          marginBottom: "1.25rem",
        }}
      >
        <label
          htmlFor="subsidy-search"
          style={{
            display: "block",
            color: "var(--text-base)",
            fontSize: ".875rem",
            marginBottom: ".5rem",
            fontWeight: "bold",
          }}
        >
          補助金を検索
        </label>
        <input
          id="subsidy-search"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="制度名、用途、業種、地域で検索"
          style={{
            width: "100%",
            border: "1px solid var(--border-strong)",
            backgroundColor: "#fff",
            color: "var(--text-strong)",
            borderRadius: "8px",
            padding: ".8rem .95rem",
            fontSize: ".95rem",
            outline: "none",
          }}
        />
        <div style={{ marginTop: ".85rem" }}>
          <label
            htmlFor="prefecture-filter"
            style={{
              display: "block",
              color: "var(--text-base)",
              fontSize: ".8rem",
              marginBottom: ".4rem",
              fontWeight: "bold",
            }}
          >
            都道府県で絞り込み
          </label>
          <select
            id="prefecture-filter"
            value={prefectureFilter}
            onChange={(e) => setPrefectureFilter(e.target.value)}
            style={{
              width: "100%",
              border: "1px solid var(--border-strong)",
              backgroundColor: "#fff",
              color: "var(--text-strong)",
              borderRadius: "8px",
              padding: ".72rem .9rem",
              fontSize: ".9rem",
            }}
          >
            <option value="all">すべての地域</option>
            {PREFECTURES.map((prefecture) => (
              <option key={prefecture} value={prefecture}>
                {prefecture}
              </option>
            ))}
          </select>
        </div>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: ".5rem",
            marginTop: ".85rem",
          }}
        >
          {[
            { value: "all", label: "すべて", color: "#5f766d" },
            { value: "open", label: "受付中", color: "#22c55e" },
            { value: "upcoming", label: "公募前", color: "#f59e0b" },
            { value: "closed", label: "終了", color: "#6b7280" },
            { value: "unknown", label: "要確認", color: "#94a3b8" },
          ].map((option) => {
            const selected = statusFilter === option.value
            return (
              <button
                key={option.value}
                type="button"
                onClick={() =>
                  setStatusFilter(option.value as "all" | SubsidyIndexItem["status"])
                }
                style={{
                  borderRadius: "999px",
                  border: `1px solid ${selected ? option.color : "var(--border-soft)"}`,
                  backgroundColor: selected ? `${option.color}22` : "var(--bg-surface-alt)",
                  color: selected ? option.color : "var(--text-base)",
                  padding: ".45rem .8rem",
                  fontSize: ".8rem",
                  cursor: "pointer",
                }}
              >
                {option.label}
              </button>
            )
          })}
        </div>
        <p
          style={{
            color: "var(--text-muted)",
            fontSize: ".8rem",
            marginTop: ".65rem",
          }}
        >
          {query || statusFilter !== "all" || prefectureFilter !== "all"
            ? `${filtered.length}件ヒット`
            : `${subsidies.length}件を表示中`}
        </p>
      </section>

      {filtered.length === 0 ? (
        <div
          style={{
            backgroundColor: "var(--bg-surface)",
            border: "1px solid var(--border-soft)",
            borderRadius: "8px",
            padding: "2rem",
            textAlign: "center",
            color: "var(--text-muted)",
          }}
        >
          <p style={{ marginBottom: ".5rem" }}>該当する補助金が見つかりませんでした</p>
          <p style={{ fontSize: ".85rem" }}>
            キーワード、受付状態、都道府県を変えて試してください。
          </p>
        </div>
      ) : (
        <div style={{ display: "grid", gap: ".75rem" }}>
          {filtered.map((s) => {
            const st = statusLabel[s.status] ?? statusLabel.unknown
            return (
              <Link
                key={s.id}
                href={`/subsidies/${s.slug}`}
                style={{ textDecoration: "none" }}
              >
                <div
                  style={{
                    backgroundColor: "var(--bg-surface)",
                    borderRadius: "8px",
                    padding: "1.25rem",
                    border: "1px solid var(--border-soft)",
                    transition: "border-color .15s",
                    cursor: "pointer",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: ".75rem",
                      flexWrap: "wrap",
                    }}
                  >
                    <span
                      style={{
                        backgroundColor: st.color + "22",
                        color: st.color,
                        border: `1px solid ${st.color}44`,
                        borderRadius: "4px",
                        padding: ".15rem .5rem",
                        fontSize: ".75rem",
                        whiteSpace: "nowrap",
                        flexShrink: 0,
                      }}
                    >
                      {st.label}
                    </span>
                    <span
                      style={{
                        backgroundColor: "var(--bg-surface-alt)",
                        color: "#94a3b8",
                        borderRadius: "4px",
                        padding: ".15rem .5rem",
                        fontSize: ".75rem",
                        whiteSpace: "nowrap",
                        flexShrink: 0,
                      }}
                    >
                      {regionLabel[s.region] ?? s.region}
                    </span>
                    <h2
                      style={{
                        color: "var(--text-strong)",
                        fontSize: ".95rem",
                        fontWeight: "bold",
                        margin: 0,
                        flex: 1,
                        minWidth: "200px",
                      }}
                    >
                      {s.title}
                    </h2>
                  </div>
                  <div
                    style={{
                      marginTop: ".75rem",
                      display: "flex",
                      gap: ".5rem",
                      flexWrap: "wrap",
                    }}
                  >
                    {s.purposes.slice(0, 4).map((p) => (
                      <span
                        key={p}
                        style={{
                          backgroundColor: "var(--bg-tag)",
                          color: "#38b48b",
                          borderRadius: "4px",
                          padding: ".1rem .4rem",
                          fontSize: ".75rem",
                        }}
                      >
                        {p}
                      </span>
                    ))}
                    {s.upperLimit && (
                      <span
                        style={{
                          marginLeft: "auto",
                          color: "#f59e0b",
                          fontSize: ".8rem",
                          whiteSpace: "nowrap",
                        }}
                      >
                        上限 {s.upperLimit}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}

function matchesPrefectureFilter(subsidy: SubsidyIndexItem, prefecture: string) {
  if (subsidy.region === "national" || subsidy.prefectures.includes("全国")) return true
  if (subsidy.prefectures.includes(prefecture)) return true

  return subsidy.prefectures.some((area) => AREA_PREFECTURES[area]?.includes(prefecture))
}

function parseStatusFilter(value: string | null): "all" | SubsidyIndexItem["status"] {
  if (value === "all" || value === "open" || value === "upcoming" || value === "closed" || value === "unknown") {
    return value
  }

  return "open"
}

function parsePrefectureFilter(value: string | null) {
  if (value && PREFECTURES.includes(value)) {
    return value
  }

  return "all"
}
