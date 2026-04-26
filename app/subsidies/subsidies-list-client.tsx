"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { PREFECTURES, isPrefecture, matchesPrefecture } from "../../lib/prefectures"
import type { SubsidyIndexItem } from "../../lib/types"
import { formatAmount, parseAmount } from "../../lib/format"
import PurposeTagLink from "../../components/elements/purpose-tag-link"

const SITE_NAME = "RSubsidy 補助金サーチ"

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
  initialPrefecture = "all",
  showPrefectureFilter = true,
  availablePurposes = ["設備投資", "デジタル化", "研究開発", "販路拡大", "人材育成", "省エネ", "創業", "事業承継"],
}: {
  subsidies: SubsidyIndexItem[]
  initialPrefecture?: string
  showPrefectureFilter?: boolean
  availablePurposes?: string[]
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [query, setQuery] = useState(() => searchParams.get("q") ?? "")
  const [statusFilter, setStatusFilter] = useState<"all" | SubsidyIndexItem["status"]>(() =>
    parseStatusFilter(searchParams.get("status"))
  )
  const [prefectureFilter, setPrefectureFilter] = useState(() =>
    parsePrefectureFilter(searchParams.get("prefecture") ?? initialPrefecture)
  )
  const [purposeFilter, setPurposeFilter] = useState(() => searchParams.get("purpose") ?? "all")
  const [amountFilter, setAmountFilter] = useState(() => searchParams.get("amount") ?? "all")
  const filterTitle = buildFilterTitle(query, statusFilter, prefectureFilter, purposeFilter)

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

    if (prefectureFilter !== initialPrefecture && prefectureFilter !== "all") {
      params.set("prefecture", prefectureFilter)
    } else {
      params.delete("prefecture")
    }

    if (purposeFilter !== "all") {
      params.set("purpose", purposeFilter)
    } else {
      params.delete("purpose")
    }

    if (amountFilter !== "all") {
      params.set("amount", amountFilter)
    } else {
      params.delete("amount")
    }

    const nextUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname
    const currentUrl = searchParams.toString() ? `${pathname}?${searchParams.toString()}` : pathname

    if (nextUrl !== currentUrl) {
      router.replace(nextUrl, { scroll: false })
    }
  }, [amountFilter, initialPrefecture, pathname, prefectureFilter, purposeFilter, query, router, searchParams, statusFilter])

  useEffect(() => {
    document.title = `${filterTitle} | ${SITE_NAME}`
  }, [filterTitle])

  const filtered = useMemo(() => {
    const normalizedQuery = normalizeText(query)
    return subsidies.filter((subsidy) => {
      const matchesQuery = !normalizedQuery
        ? true
        : buildSearchIndex(subsidy).includes(normalizedQuery)
      const matchesStatus = statusFilter === "all" ? true : subsidy.status === statusFilter
      const matchesSelectedPrefecture =
        prefectureFilter === "all"
          ? true
          : prefectureFilter === "national"
            ? subsidy.region === "national" || subsidy.prefectures.includes("全国")
            : matchesPrefecture(subsidy, prefectureFilter)

      const matchesPurpose = purposeFilter === "all" ? true : subsidy.purposes.includes(purposeFilter)
      const matchesAmount = (() => {
        if (amountFilter === "all") return true
        const n = parseAmount(subsidy.upperLimit)
        if (amountFilter === "unknown") return n === null
        if (n === null) return false
        if (amountFilter === "under100") return n < 1_000_000
        if (amountFilter === "100to1000") return n >= 1_000_000 && n < 10_000_000
        if (amountFilter === "1000to1oku") return n >= 10_000_000 && n < 100_000_000
        if (amountFilter === "1okuto10oku") return n >= 100_000_000 && n < 1_000_000_000
        if (amountFilter === "over10oku") return n >= 1_000_000_000
        return true
      })()
      return matchesQuery && matchesStatus && matchesSelectedPrefecture && matchesPurpose && matchesAmount
    })
    .toSorted((a, b) => {
      if (a.startDate === b.startDate) return 0
      if (!a.startDate) return 1
      if (!b.startDate) return -1
      return b.startDate.localeCompare(a.startDate)
    })
  }, [amountFilter, query, prefectureFilter, purposeFilter, statusFilter, subsidies])

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
      <div style={{ marginBottom: "1rem" }}>
        <h2
          style={{
            color: "var(--text-strong)",
            fontSize: "1.15rem",
            marginBottom: ".35rem",
          }}
        >
          {filterTitle}
        </h2>
        <p style={{ color: "var(--text-muted)", fontSize: ".85rem" }}>
          条件を変更すると、この見出しとURLも更新されます。
        </p>
      </div>
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
        {showPrefectureFilter && (
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
              <option value="national">国の補助金（全国対象）</option>
              {PREFECTURES.map((prefecture) => (
                <option key={prefecture} value={prefecture}>
                  {prefecture}
                </option>
              ))}
            </select>
          </div>
        )}
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
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: ".5rem",
            marginTop: ".85rem",
          }}
        >
          {["all", ...availablePurposes].map((p) => {
            const selected = purposeFilter === p
            return (
              <button
                key={p}
                type="button"
                onClick={() => setPurposeFilter(p)}
                style={{
                  borderRadius: "999px",
                  border: `1px solid ${selected ? "#38b48b" : "var(--border-soft)"}`,
                  backgroundColor: selected ? "#38b48b22" : "var(--bg-surface-alt)",
                  color: selected ? "#38b48b" : "var(--text-base)",
                  padding: ".45rem .8rem",
                  fontSize: ".8rem",
                  cursor: "pointer",
                }}
              >
                {p === "all" ? "すべての用途" : p}
              </button>
            )
          })}
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
            { value: "all", label: "すべての金額" },
            { value: "under100", label: "〜100万円" },
            { value: "100to1000", label: "100万〜1,000万円" },
            { value: "1000to1oku", label: "1,000万〜1億円" },
            { value: "1okuto10oku", label: "1億〜10億円" },
            { value: "over10oku", label: "10億円以上" },
            { value: "unknown", label: "金額情報なし" },
          ].map((option) => {
            const selected = amountFilter === option.value
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => setAmountFilter(option.value)}
                style={{
                  borderRadius: "999px",
                  border: `1px solid ${selected ? "#6366f1" : "var(--border-soft)"}`,
                  backgroundColor: selected ? "#6366f122" : "var(--bg-surface-alt)",
                  color: selected ? "#6366f1" : "var(--text-base)",
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
          {query || statusFilter !== "all" || prefectureFilter !== "all" || purposeFilter !== "all" || amountFilter !== "all"
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
                  {s.overview && (
                    <p
                      style={{
                        color: "var(--text-muted)",
                        fontSize: ".8rem",
                        marginTop: ".5rem",
                        lineHeight: 1.6,
                        overflow: "hidden",
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                      }}
                    >
                      {s.overview}
                    </p>
                  )}
                  <div
                    style={{
                      marginTop: ".75rem",
                      display: "flex",
                      gap: ".5rem",
                      flexWrap: "wrap",
                    }}
                  >
                    {s.purposes.slice(0, 4).map((p) => (
                      <PurposeTagLink key={p} purpose={p} />
                    ))}
                    {s.upperLimit && s.upperLimit !== "0円" && (
                      <span
                        style={{
                          marginLeft: "auto",
                          color: "#f59e0b",
                          fontSize: ".8rem",
                          whiteSpace: "nowrap",
                        }}
                      >
                        上限 {formatAmount(s.upperLimit)}
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

function parseStatusFilter(value: string | null): "all" | SubsidyIndexItem["status"] {
  if (value === "all" || value === "open" || value === "upcoming" || value === "closed" || value === "unknown") {
    return value
  }

  return "open"
}

function parsePrefectureFilter(value: string | null) {
  if (value === "national") return "national"
  if (value && isPrefecture(value)) return value
  return "all"
}

function buildFilterTitle(
  query: string,
  statusFilter: "all" | SubsidyIndexItem["status"],
  prefectureFilter: string,
  purposeFilter: string
) {
  const area =
    prefectureFilter === "all" ? "" : prefectureFilter === "national" ? "国の補助金" : prefectureFilter
  const status = statusFilter === "all" ? "" : statusLabel[statusFilter].label
  const purpose = purposeFilter === "all" ? "" : purposeFilter
  const prefix =
    area && status
      ? `${area}で${status}の`
      : area
        ? `${area}の`
        : status
          ? `${status}の`
          : ""
  const baseTitle = `${prefix}${purpose ? `${purpose}向け` : ""}補助金一覧`

  return query ? `${baseTitle}（「${query}」の検索結果）` : baseTitle
}
