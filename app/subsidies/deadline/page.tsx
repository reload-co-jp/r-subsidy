import type { Metadata } from "next"
import { absoluteUrl, buildBreadcrumbList } from "../../../lib/site"
import { formatDate } from "../../../lib/format"
import {
  CURRENT_YEAR,
  TODAY,
  getDeadlineGroups,
  loadSubsidyIndex,
} from "../../../lib/seo"
import { Breadcrumb } from "../../../components/elements/breadcrumb"
import SubsidyLinkList from "../../../components/elements/subsidy-link-list"

const PAGE_URL = absoluteUrl("/subsidies/deadline/")
const TITLE = `締切が近い補助金・助成金一覧｜${CURRENT_YEAR}年最新`
const DESCRIPTION =
  "今週締切・今月締切・30日以内に締切を迎える受付中の補助金・助成金を締切日順に掲載。申請準備の優先順位づけに使えます。"

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: PAGE_URL },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: PAGE_URL,
    type: "website",
  },
}

export default function Page() {
  const { thisWeek, thisMonth, soon } = getDeadlineGroups(loadSubsidyIndex())
  const sections = [
    { id: "this-week", heading: "今週締切の補助金", items: thisWeek },
    { id: "this-month", heading: "今月締切の補助金", items: thisMonth },
    { id: "within-30-days", heading: "30日以内に締切の補助金", items: soon },
  ]
  const breadcrumbList = buildBreadcrumbList([
    { name: "ホーム", url: absoluteUrl("/") },
    { name: "補助金一覧", url: absoluteUrl("/subsidies/") },
    { name: "締切が近い補助金", url: PAGE_URL },
  ])

  return (
    <div className="page-content">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbList) }}
      />
      <Breadcrumb
        items={[
          { label: "ホーム", href: "/" },
          { label: "補助金一覧", href: "/subsidies" },
          { label: "締切が近い補助金" },
        ]}
      />
      <h1 className="page-title">締切が近い補助金・助成金</h1>
      <p className="page-lead">
        {formatDate(TODAY)}
        時点で受付中の補助金のうち、締切が近いものを締切日順に掲載しています。申請には事業計画書の作成やGビズIDの取得に時間がかかるため、早めに準備を始めましょう。受付開始前の制度は
        <a href="/subsidies/upcoming/">公募予定の補助金</a>、受付中の全制度は
        <a href="/subsidies/open/">受付中の補助金</a>をご覧ください。
      </p>
      <nav
        aria-label="期間で移動"
        className="chip-group"
        style={{ margin: "1rem 0 1.5rem" }}
      >
        {sections.map((s) => (
          <a key={s.id} href={`#${s.id}`} className="chip">
            {s.heading}（{s.items.length}）
          </a>
        ))}
      </nav>
      {sections.map((s) => (
        <section key={s.id} id={s.id} style={{ marginBottom: "2rem" }}>
          <h2 className="sub-title">{s.heading}</h2>
          <SubsidyLinkList items={s.items} />
        </section>
      ))}
    </div>
  )
}
