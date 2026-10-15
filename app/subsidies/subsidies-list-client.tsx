"use client"

import { Suspense, useEffect, useMemo, useState } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import {
  PREFECTURES,
  isPrefecture,
  matchesPrefecture,
} from "../../lib/prefectures"
import type { Status, SubsidyIndexItem } from "../../lib/types"
import { formatDate, parseAmount, purposeLabel } from "../../lib/format"
import SubsidyCard from "../../components/elements/subsidy-card"
import { STATUS_LABEL } from "../../components/elements/status-badge"

const SITE_NAME = "RSubsidy 補助金サーチ"
const PAGE_SIZE = 20

type StatusFilter = "all" | Status
type SortKey = "new" | "deadline" | "amount"

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "すべて" },
  { value: "open", label: STATUS_LABEL.open },
  { value: "upcoming", label: STATUS_LABEL.upcoming },
  { value: "closed", label: STATUS_LABEL.closed },
  { value: "unknown", label: STATUS_LABEL.unknown },
]

const AMOUNT_OPTIONS = [
  { value: "all", label: "すべての金額" },
  { value: "under100", label: "〜100万円" },
  { value: "100to1000", label: "100万〜1,000万円" },
  { value: "1000to1oku", label: "1,000万〜1億円" },
  { value: "1okuto10oku", label: "1億〜10億円" },
  { value: "over10oku", label: "10億円以上" },
  { value: "unknown", label: "金額情報なし" },
]

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "new", label: "受付開始が新しい順" },
  { value: "deadline", label: "締切が近い順" },
  { value: "amount", label: "補助上限額が大きい順" },
]

const regionLabel: Record<string, string> = {
  national: "全国",
  tokyo: "東京都",
  prefecture: "都道府県",
}

function normalizeText(value: string) {
  return value.toLowerCase().replace(/\s+/g, "")
}

function buildSearchIndex(subsidy: SubsidyIndexItem) {
  return normalizeText(
    [
      subsidy.title,
      regionLabel[subsidy.region] ?? subsidy.region,
      STATUS_LABEL[subsidy.status],
      ...subsidy.prefectures,
      ...subsidy.purposes.map(purposeLabel),
      ...subsidy.purposes,
      ...subsidy.industries,
      subsidy.upperLimit ?? "",
      subsidy.startDate ?? "",
      subsidy.endDate ?? "",
    ].join(" ")
  )
}

function formatPeriod(startDate: string | null, endDate: string | null) {
  const start = formatDate(startDate)
  const end = formatDate(endDate)
  if (start && end) return `${start}〜${end}`
  if (start) return `${start}〜`
  if (end) return `〜${end}`
  return null
}

function matchesAmount(subsidy: SubsidyIndexItem, amountFilter: string) {
  if (amountFilter === "all") return true
  const n = parseAmount(subsidy.upperLimit)
  if (amountFilter === "unknown") return n === null
  if (n === null) return false
  if (amountFilter === "under100") return n < 1_000_000
  if (amountFilter === "100to1000") return n >= 1_000_000 && n < 10_000_000
  if (amountFilter === "1000to1oku") return n >= 10_000_000 && n < 100_000_000
  if (amountFilter === "1okuto10oku")
    return n >= 100_000_000 && n < 1_000_000_000
  if (amountFilter === "over10oku") return n >= 1_000_000_000
  return true
}

// 値なしは常に末尾
function compareNullable<T>(
  a: T | null,
  b: T | null,
  cmp: (a: T, b: T) => number
) {
  if (a === b) return 0
  if (a === null) return 1
  if (b === null) return -1
  return cmp(a, b)
}

function sortSubsidies(items: SubsidyIndexItem[], sort: SortKey) {
  if (sort === "deadline") {
    return items.toSorted((a, b) =>
      compareNullable(a.endDate, b.endDate, (x, y) => x.localeCompare(y))
    )
  }
  if (sort === "amount") {
    return items.toSorted((a, b) =>
      compareNullable(
        parseAmount(a.upperLimit),
        parseAmount(b.upperLimit),
        (x, y) => y - x
      )
    )
  }
  return items.toSorted((a, b) =>
    compareNullable(a.startDate, b.startDate, (x, y) => y.localeCompare(x))
  )
}

function SubsidyCards({ items }: { items: SubsidyIndexItem[] }) {
  return (
    <ul className="list-plain grid">
      {items.map((s) => (
        <li key={s.id}>
          <SubsidyCard
            slug={s.slug}
            title={s.title}
            status={s.status}
            region={s.region}
            prefectures={s.prefectures}
            upperLimit={s.upperLimit}
            endDate={s.endDate}
            purposes={s.purposes}
            overview={s.overview}
            period={formatPeriod(s.startDate, s.endDate)}
          />
        </li>
      ))}
    </ul>
  )
}

type Props = {
  subsidies: SubsidyIndexItem[]
  initialPrefecture?: string
  showPrefectureFilter?: boolean
  availablePurposes?: string[]
}

// 静的書き出しでは useSearchParams を使う部分はクライアント描画になるため、
// HTMLには既定条件（受付中・新着順）の1ページ目をフォールバックとして出力し、検索エンジンにも内容を渡す
export default function SubsidiesListClient(props: Props) {
  const initial = sortSubsidies(
    props.subsidies.filter((s) => s.status === "open"),
    "new"
  )
  return (
    <Suspense
      fallback={
        <div>
          <p className="section-lead" style={{ marginBottom: "1rem" }}>
            受付中の補助金 {initial.length}件（受付開始が新しい順）
          </p>
          <SubsidyCards items={initial.slice(0, PAGE_SIZE)} />
        </div>
      }
    >
      <SubsidiesList {...props} />
    </Suspense>
  )
}

function SubsidiesList({
  subsidies,
  initialPrefecture = "all",
  showPrefectureFilter = true,
  availablePurposes = [
    "設備投資",
    "デジタル化",
    "研究開発",
    "販路拡大",
    "人材育成",
    "省エネ",
    "創業",
    "事業承継",
  ],
}: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [query, setQuery] = useState(() => searchParams.get("q") ?? "")
  const [statusFilter, setStatusFilter] = useState<StatusFilter>(() =>
    parseStatusFilter(searchParams.get("status"))
  )
  const [prefectureFilter, setPrefectureFilter] = useState(() =>
    parsePrefectureFilter(searchParams.get("prefecture") ?? initialPrefecture)
  )
  const [purposeFilter, setPurposeFilter] = useState(
    () => searchParams.get("purpose") ?? "all"
  )
  const [industryFilter, setIndustryFilter] = useState(
    () => searchParams.get("industry") ?? "all"
  )
  const [amountFilter, setAmountFilter] = useState(
    () => searchParams.get("amount") ?? "all"
  )
  const [smeFilter, setSmeFilter] = useState(
    () => searchParams.get("sme") === "true"
  )
  const [sort, setSort] = useState<SortKey>(() =>
    parseSort(searchParams.get("sort"))
  )
  const [page, setPage] = useState(() =>
    Math.max(1, Number(searchParams.get("page")) || 1)
  )

  const availableIndustries = useMemo(() => {
    const counts = new Map<string, number>()
    for (const s of subsidies)
      for (const i of s.industries) counts.set(i, (counts.get(i) ?? 0) + 1)
    return [...counts].toSorted((a, b) => b[1] - a[1]).map(([name]) => name)
  }, [subsidies])

  const filterTitle = buildFilterTitle(
    query,
    statusFilter,
    prefectureFilter,
    purposeFilter,
    smeFilter
  )

  // フィルター変更時は1ページ目へ
  const update =
    <T,>(setter: (v: T) => void) =>
    (v: T) => {
      setter(v)
      setPage(1)
    }

  useEffect(() => {
    // utm等の未知パラメータは残す
    const params = new URLSearchParams(searchParams.toString())
    for (const key of [
      "q",
      "status",
      "prefecture",
      "purpose",
      "industry",
      "amount",
      "sme",
      "sort",
      "page",
    ])
      params.delete(key)
    if (query) params.set("q", query)
    if (statusFilter !== "open") params.set("status", statusFilter)
    if (prefectureFilter !== initialPrefecture && prefectureFilter !== "all")
      params.set("prefecture", prefectureFilter)
    if (purposeFilter !== "all") params.set("purpose", purposeFilter)
    if (industryFilter !== "all") params.set("industry", industryFilter)
    if (amountFilter !== "all") params.set("amount", amountFilter)
    if (smeFilter) params.set("sme", "true")
    if (sort !== "new") params.set("sort", sort)
    if (page > 1) params.set("page", String(page))

    const nextUrl = params.toString()
      ? `${pathname}?${params.toString()}`
      : pathname
    const currentUrl = searchParams.toString()
      ? `${pathname}?${searchParams.toString()}`
      : pathname
    if (nextUrl !== currentUrl) router.replace(nextUrl, { scroll: false })
  }, [
    amountFilter,
    industryFilter,
    initialPrefecture,
    page,
    pathname,
    prefectureFilter,
    purposeFilter,
    query,
    router,
    searchParams,
    smeFilter,
    sort,
    statusFilter,
  ])

  useEffect(() => {
    document.title = `${filterTitle} | ${SITE_NAME}`
  }, [filterTitle])

  const filtered = useMemo(() => {
    const normalizedQuery = normalizeText(query)
    const items = subsidies.filter((subsidy) => {
      if (
        normalizedQuery &&
        !buildSearchIndex(subsidy).includes(normalizedQuery)
      )
        return false
      if (statusFilter !== "all" && subsidy.status !== statusFilter)
        return false
      if (prefectureFilter === "national") {
        if (
          !(
            subsidy.region === "national" ||
            subsidy.prefectures.includes("全国")
          )
        )
          return false
      } else if (
        prefectureFilter !== "all" &&
        !matchesPrefecture(subsidy, prefectureFilter)
      )
        return false
      if (purposeFilter !== "all" && !subsidy.purposes.includes(purposeFilter))
        return false
      if (
        industryFilter !== "all" &&
        !subsidy.industries.includes(industryFilter)
      )
        return false
      if (smeFilter && !subsidy.isForSME) return false
      return matchesAmount(subsidy, amountFilter)
    })
    return sortSubsidies(items, sort)
  }, [
    amountFilter,
    industryFilter,
    query,
    prefectureFilter,
    purposeFilter,
    smeFilter,
    sort,
    statusFilter,
    subsidies,
  ])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const pageItems = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  )

  const activeFilters = [
    query && `キーワード「${query}」`,
    statusFilter !== "all" && STATUS_LABEL[statusFilter],
    prefectureFilter !== "all" &&
      prefectureFilter !== initialPrefecture &&
      (prefectureFilter === "national" ? "国の補助金" : prefectureFilter),
    purposeFilter !== "all" && purposeLabel(purposeFilter),
    industryFilter !== "all" && industryFilter,
    amountFilter !== "all" &&
      AMOUNT_OPTIONS.find((o) => o.value === amountFilter)?.label,
    smeFilter && "中小企業向け",
  ].filter(Boolean) as string[]

  function resetFilters() {
    setQuery("")
    setStatusFilter("all")
    setPrefectureFilter(
      initialPrefecture === "all"
        ? "all"
        : parsePrefectureFilter(initialPrefecture)
    )
    setPurposeFilter("all")
    setIndustryFilter("all")
    setAmountFilter("all")
    setSmeFilter(false)
    setPage(1)
  }

  function goToPage(p: number) {
    setPage(p)
    document
      .getElementById("subsidy-results")
      ?.scrollIntoView({ block: "start" })
  }

  if (subsidies.length === 0) {
    return (
      <div
        className="card"
        style={{ textAlign: "center", color: "var(--text-muted)" }}
      >
        補助金データがありません
      </div>
    )
  }

  return (
    <div>
      <section
        className="card"
        aria-label="検索・絞り込み"
        style={{ marginBottom: "1.25rem", display: "grid", gap: "1rem" }}
      >
        <div>
          <label htmlFor="subsidy-search" className="field-label">
            キーワード
          </label>
          <input
            id="subsidy-search"
            type="search"
            className="input"
            value={query}
            onChange={(e) => update(setQuery)(e.target.value)}
            placeholder="制度名、用途、業種、地域で検索"
          />
        </div>
        <div className="grid grid-4" style={{ gap: ".75rem" }}>
          {showPrefectureFilter && (
            <div>
              <label htmlFor="prefecture-filter" className="field-label">
                地域
              </label>
              <select
                id="prefecture-filter"
                className="select"
                value={prefectureFilter}
                onChange={(e) => update(setPrefectureFilter)(e.target.value)}
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
          <div>
            <label htmlFor="purpose-filter" className="field-label">
              目的
            </label>
            <select
              id="purpose-filter"
              className="select"
              value={purposeFilter}
              onChange={(e) => update(setPurposeFilter)(e.target.value)}
            >
              <option value="all">すべての目的</option>
              {availablePurposes.map((p) => (
                <option key={p} value={p}>
                  {purposeLabel(p)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="industry-filter" className="field-label">
              業種
            </label>
            <select
              id="industry-filter"
              className="select"
              value={industryFilter}
              onChange={(e) => update(setIndustryFilter)(e.target.value)}
            >
              <option value="all">すべての業種</option>
              {availableIndustries.map((i) => (
                <option key={i} value={i}>
                  {i}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="amount-filter" className="field-label">
              補助上限額
            </label>
            <select
              id="amount-filter"
              className="select"
              value={amountFilter}
              onChange={(e) => update(setAmountFilter)(e.target.value)}
            >
              {AMOUNT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        <fieldset style={{ border: 0, padding: 0 }}>
          <legend className="field-label">受付状態</legend>
          <div className="chip-group">
            {STATUS_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                className="chip"
                aria-pressed={statusFilter === option.value}
                onClick={() => update(setStatusFilter)(option.value)}
              >
                {option.label}
              </button>
            ))}
            <button
              type="button"
              className="chip"
              aria-pressed={smeFilter}
              onClick={() => update(setSmeFilter)(!smeFilter)}
            >
              中小企業向けのみ
            </button>
          </div>
        </fieldset>
      </section>

      <div
        id="subsidy-results"
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: ".75rem",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "1rem",
          scrollMarginTop: "80px",
        }}
      >
        <div>
          <h2 style={{ fontSize: "1.1rem" }}>{filterTitle}</h2>
          <p
            aria-live="polite"
            style={{ color: "var(--text-muted)", fontSize: ".85rem" }}
          >
            <strong style={{ color: "var(--text-strong)", fontSize: "1rem" }}>
              {filtered.length.toLocaleString()}
            </strong>
            件
            {filtered.length > 0 &&
              `（${(currentPage - 1) * PAGE_SIZE + 1}〜${Math.min(currentPage * PAGE_SIZE, filtered.length)}件目を表示）`}
          </p>
          {activeFilters.length > 0 && (
            <p
              style={{
                fontSize: ".8rem",
                color: "var(--text-muted)",
                marginTop: ".25rem",
              }}
            >
              絞り込み条件：{activeFilters.join(" ／ ")}
              <button
                type="button"
                onClick={resetFilters}
                style={{
                  marginLeft: ".75rem",
                  background: "none",
                  border: 0,
                  color: "var(--green-dark)",
                  textDecoration: "underline",
                  cursor: "pointer",
                  fontSize: ".8rem",
                }}
              >
                条件をクリア
              </button>
            </p>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: ".5rem" }}>
          <label
            htmlFor="sort"
            style={{ fontSize: ".85rem", whiteSpace: "nowrap" }}
          >
            並び替え
          </label>
          <select
            id="sort"
            className="select"
            style={{ width: "auto" }}
            value={sort}
            onChange={(e) => update(setSort)(e.target.value as SortKey)}
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div
          className="card"
          style={{ textAlign: "center", color: "var(--text-muted)" }}
        >
          <p style={{ marginBottom: ".5rem" }}>
            該当する補助金が見つかりませんでした
          </p>
          <p style={{ fontSize: ".85rem" }}>
            キーワードや受付状態、地域を変えて試してください。
          </p>
        </div>
      ) : (
        <SubsidyCards items={pageItems} />
      )}

      {totalPages > 1 && (
        <nav className="pagination" aria-label="ページ送り">
          <button
            type="button"
            disabled={currentPage === 1}
            onClick={() => goToPage(currentPage - 1)}
          >
            前へ
          </button>
          {pageNumbers(currentPage, totalPages).map((p, i) =>
            p === null ? (
              <span
                key={`gap-${i}`}
                aria-hidden="true"
                style={{ alignSelf: "center" }}
              >
                …
              </span>
            ) : (
              <button
                key={p}
                type="button"
                aria-current={p === currentPage ? "page" : undefined}
                aria-label={`${p}ページ目`}
                onClick={() => goToPage(p)}
              >
                {p}
              </button>
            )
          )}
          <button
            type="button"
            disabled={currentPage === totalPages}
            onClick={() => goToPage(currentPage + 1)}
          >
            次へ
          </button>
        </nav>
      )}
    </div>
  )
}

function pageNumbers(current: number, total: number): (number | null)[] {
  const pages = [...new Set([1, current - 1, current, current + 1, total])]
    .filter((p) => p >= 1 && p <= total)
    .toSorted((a, b) => a - b)
  return pages.flatMap((p, i) =>
    i > 0 && p - pages[i - 1] > 1 ? [null, p] : [p]
  )
}

function parseStatusFilter(value: string | null): StatusFilter {
  if (
    value === "all" ||
    value === "open" ||
    value === "upcoming" ||
    value === "closed" ||
    value === "unknown"
  )
    return value
  return "open"
}

function parseSort(value: string | null): SortKey {
  return value === "deadline" || value === "amount" ? value : "new"
}

function parsePrefectureFilter(value: string | null) {
  if (value === "national") return "national"
  if (value && isPrefecture(value)) return value
  return "all"
}

function buildFilterTitle(
  query: string,
  statusFilter: StatusFilter,
  prefectureFilter: string,
  purposeFilter: string,
  smeFilter: boolean
) {
  const area =
    prefectureFilter === "all"
      ? ""
      : prefectureFilter === "national"
        ? "国の補助金"
        : prefectureFilter
  const status = statusFilter === "all" ? "" : STATUS_LABEL[statusFilter]
  const purpose = purposeFilter === "all" ? "" : purposeLabel(purposeFilter)
  const prefix =
    area && status
      ? `${area}で${status}の`
      : area
        ? `${area}の`
        : status
          ? `${status}の`
          : ""
  const target = smeFilter ? "中小企業向け" : purpose ? `${purpose}向け` : ""
  const baseTitle = `${prefix}${target}補助金一覧`
  return query ? `${baseTitle}（「${query}」の検索結果）` : baseTitle
}
