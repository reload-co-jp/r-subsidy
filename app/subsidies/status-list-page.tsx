import type { Metadata } from "next"
import { absoluteUrl, buildBreadcrumbList } from "../../lib/site"
import { formatDate } from "../../lib/format"
import { CURRENT_YEAR, TODAY, loadSubsidyIndex } from "../../lib/seo"
import { Breadcrumb } from "../../components/elements/breadcrumb"
import SubsidyLinkList from "../../components/elements/subsidy-link-list"

const CONFIG = {
  open: {
    label: "受付中の補助金",
    title: `受付中の補助金・助成金一覧｜${CURRENT_YEAR}年最新`,
    description: "現在申請を受け付けている補助金・助成金を締切日が近い順に一覧掲載。全国の制度と都道府県・市区町村の制度をまとめて確認できます。",
    lead: "時点で申請を受け付けている補助金・助成金を、締切日が近い順に掲載しています。",
    sort: (a: string | null, b: string | null) => (a ?? "9999").localeCompare(b ?? "9999"),
    key: "endDate",
  },
  upcoming: {
    label: "公募予定の補助金",
    title: `公募予定の補助金・助成金一覧｜${CURRENT_YEAR}年最新`,
    description: "受付開始前（公募予定）の補助金・助成金を受付開始日順に掲載。事前に事業計画や必要書類を準備したい方向けです。",
    lead: "時点で受付開始前の補助金・助成金を、受付開始日が近い順に掲載しています。公募開始までに要件の確認や事業計画書の準備を進めましょう。",
    sort: (a: string | null, b: string | null) => (a ?? "9999").localeCompare(b ?? "9999"),
    key: "startDate",
  },
} as const

type Status = keyof typeof CONFIG

export function statusPageMetadata(status: Status): Metadata {
  const { title, description } = CONFIG[status]
  const url = absoluteUrl(`/subsidies/${status}/`)
  return { title, description, alternates: { canonical: url }, openGraph: { title, description, url, type: "website" } }
}

export function StatusListPage({ status }: { status: Status }) {
  const { label, lead, sort, key } = CONFIG[status]
  const url = absoluteUrl(`/subsidies/${status}/`)
  const items = loadSubsidyIndex()
    .filter((s) => s.status === status)
    .toSorted((a, b) => sort(a[key], b[key]))
  const breadcrumbList = buildBreadcrumbList([
    { name: "ホーム", url: absoluteUrl("/") },
    { name: "補助金一覧", url: absoluteUrl("/subsidies/") },
    { name: label, url },
  ])

  return (
    <div className="page-content">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbList) }} />
      <Breadcrumb items={[{ label: "ホーム", href: "/" }, { label: "補助金一覧", href: "/subsidies" }, { label }]} />
      <h1 style={{ color: "var(--text-strong)", fontSize: "1.55rem", marginBottom: ".55rem" }}>
        {label}（{items.length}件）
      </h1>
      <p style={{ color: "var(--text-muted)", fontSize: ".9rem", lineHeight: 1.8, marginBottom: "1.5rem" }}>
        {formatDate(TODAY)}
        {lead}締切が近い制度は<a href="/subsidies/deadline/" style={{ color: "#38b48b" }}>締切が近い補助金</a>
        、地域や目的で絞り込む場合は<a href="/subsidies/" style={{ color: "#38b48b" }}>補助金一覧</a>をご利用ください。
      </p>
      <SubsidyLinkList items={items} />
    </div>
  )
}
