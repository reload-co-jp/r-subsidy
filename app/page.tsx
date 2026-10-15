import { FC } from "react"
import Link from "next/link"
import fs from "fs"
import path from "path"
import type { Metadata } from "next"
import { AREA_PREFECTURES, matchesPrefecture } from "../lib/prefectures"
import type { SubsidyIndexItem } from "../lib/types"
import { SITE_NAME, absoluteUrl } from "../lib/site"
import { formatDate } from "../lib/format"
import { getDeadlineGroups, loadSubsidyIndex, loadUpdateHistory, purposeLabel, toJstDate } from "../lib/seo"
import HomeSearchForm from "../components/elements/home-search-form"
import SubsidyCard from "../components/elements/subsidy-card"
import SubsidyLinkList from "../components/elements/subsidy-link-list"
import FaqSection, { buildFaqStructuredData, type FaqItem } from "../components/elements/faq-section"
import type { Guide } from "./guides/page"

export const metadata: Metadata = {
  title: `${SITE_NAME} | 中小企業・個人事業主向け補助金検索`,
  description:
    "中小企業・個人事業主向けに、国・都道府県の補助金・助成金を目的・地域・受付状態から検索できます。締切間近・受付中・公募予定の制度を一覧で確認し、補助金診断で自社に合う制度を探せます。",
  alternates: {
    canonical: absoluteUrl("/"),
  },
}

const HOME_PURPOSES = [
  { key: "デジタル化", desc: "ITツール・システム導入、DX推進" },
  { key: "設備投資", desc: "機械装置・生産設備の導入" },
  { key: "販路拡大", desc: "新規顧客開拓・展示会・EC" },
  { key: "研究開発", desc: "新製品・新技術の開発" },
  { key: "創業", desc: "起業・開業時の経費" },
  { key: "人材育成", desc: "研修・人材確保・雇用" },
  { key: "省エネ", desc: "省エネ設備・脱炭素" },
  { key: "事業承継", desc: "承継・M&A・引継ぎ" },
]

// サイト独自の一般的な解説（個別制度の条件は各公募要領が優先）
const HOME_FAQ: FaqItem[] = [
  {
    question: "補助金と助成金の違いは何ですか？",
    answer:
      "一般に、補助金は経済産業省や自治体などが政策目的に沿って公募し、審査（採択）を経て交付されるものが多く、予算や採択件数に上限があります。助成金は厚生労働省の雇用関係助成金のように、要件を満たせば原則として受給できるものが多いとされています。ただし名称と実態が一致しない制度もあるため、各制度の公募要領で確認してください。",
  },
  {
    question: "補助金はいつ受け取れますか？",
    answer:
      "多くの補助金は後払い（精算払い）です。採択・交付決定後に事業を実施して経費を支払い、実績報告と検査を経てから補助金が支払われるのが一般的です。事業実施中の資金繰りもあらかじめ計画しておく必要があります。",
  },
  {
    question: "交付決定前に購入した経費も対象になりますか？",
    answer:
      "多くの制度では、交付決定日より前に発注・契約・支払いをした経費は補助対象外です。例外を設けている制度もあるため、対象経費の期間は必ず公募要領で確認してください。",
  },
  {
    question: "このサイトの情報はどこから取得していますか？",
    answer:
      "デジタル庁が運営するJグランツの公開APIなど、公的機関が公開している情報を定期的に自動取得して掲載しています。受付状態や締切は取得時点の情報のため、申請前に必ず公式の公募要領・申請窓口で最新情報をご確認ください。",
  },
]

function getGuides(): Guide[] {
  try {
    return JSON.parse(fs.readFileSync(path.join(process.cwd(), "data", "source", "guides.json"), "utf-8"))
  } catch {
    return []
  }
}

const byStartDesc = (a: SubsidyIndexItem, b: SubsidyIndexItem) => (b.startDate ?? "").localeCompare(a.startDate ?? "")
const byStartAsc = (a: SubsidyIndexItem, b: SubsidyIndexItem) =>
  (a.startDate ?? "9999").localeCompare(b.startDate ?? "9999")

const Page: FC = () => {
  const subsidies = loadSubsidyIndex()
  const history = loadUpdateHistory()
  const guides = getGuides()
  const openList = subsidies.filter((s) => s.status === "open")
  const upcomingList = subsidies.filter((s) => s.status === "upcoming")
  const deadlineSoon = getDeadlineGroups(subsidies).soon.slice(0, 6)
  const latestOpen = openList.toSorted(byStartDesc).slice(0, 5)
  const upcoming = upcomingList.toSorted(byStartAsc).slice(0, 5)
  const activeCount = (pred: (s: SubsidyIndexItem) => boolean) => subsidies.filter((s) => s.status !== "closed" && pred(s)).length
  const lastUpdated = history ? formatDate(toJstDate(history.lastUpdated)) : null

  const structuredData = [
    {
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: "締切が近い補助金",
      itemListElement: deadlineSoon.map((s, i) => ({
        "@type": "ListItem",
        position: i + 1,
        url: absoluteUrl(`/subsidies/${s.slug}/`),
        name: s.title,
      })),
    },
    buildFaqStructuredData(HOME_FAQ),
  ]

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />

      <section className="hero">
        <div className="container">
          <h1 className="hero-title">
            自社で使える補助金を、
            <br />
            目的と地域からすぐに探せる
          </h1>
          <p className="hero-lead">
            国・都道府県の補助金・助成金{subsidies.length.toLocaleString()}件を掲載。受付状態・締切・補助上限額を比較して、中小企業・個人事業主が申請できる制度を見つけられます。
          </p>
          <div className="hero-search">
            <HomeSearchForm />
          </div>
          <div className="hero-cta">
            <span>どの制度が使えるかわからない場合は</span>
            <Link href="/diagnosis/" className="btn btn-navy">
              かんたん補助金診断（無料・登録不要）
            </Link>
          </div>
        </div>
      </section>

      <section className="section" style={{ paddingTop: "2rem", paddingBottom: "2rem" }} aria-label="掲載状況">
        <div className="container">
          <div className="stat-grid">
            <div className="stat">
              <p className="stat-value">
                {subsidies.length.toLocaleString()}
                <small>件</small>
              </p>
              <p className="stat-label">掲載補助金数</p>
            </div>
            <Link href="/subsidies/open/" className="stat" style={{ textDecoration: "none" }}>
              <p className="stat-value" style={{ color: "var(--green-dark)" }}>
                {openList.length.toLocaleString()}
                <small>件</small>
              </p>
              <p className="stat-label">受付中 →</p>
            </Link>
            <Link href="/subsidies/upcoming/" className="stat" style={{ textDecoration: "none" }}>
              <p className="stat-value" style={{ color: "var(--amber-text)" }}>
                {upcomingList.length.toLocaleString()}
                <small>件</small>
              </p>
              <p className="stat-label">公募予定 →</p>
            </Link>
            <div className="stat">
              <p className="stat-value" style={{ fontSize: "1.15rem", paddingTop: ".35rem" }}>
                {lastUpdated ?? "未取得"}
              </p>
              <p className="stat-label">最終データ更新</p>
            </div>
          </div>
        </div>
      </section>

      {deadlineSoon.length > 0 && (
        <section className="section" style={{ paddingTop: "1rem" }}>
          <div className="container">
            <div className="section-head">
              <div>
                <h2 className="section-title">締切間近の補助金</h2>
                <p className="section-lead">30日以内に受付が終了する制度（締切が近い順）</p>
              </div>
              <Link href="/subsidies/deadline/" className="link-more">
                締切が近い補助金をすべて見る →
              </Link>
            </div>
            <ul className="list-plain grid grid-2">
              {deadlineSoon.map((s) => (
                <li key={s.slug}>
                  <SubsidyCard
                    slug={s.slug}
                    title={s.title}
                    status={s.status}
                    region={s.region}
                    prefectures={s.prefectures}
                    upperLimit={s.upperLimit}
                    endDate={s.endDate}
                  />
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      <section className="section section--alt" id="purposes">
        <div className="container">
          <div className="section-head">
            <div>
              <h2 className="section-title">目的から探す</h2>
              <p className="section-lead">件数は受付中・公募予定の制度数です</p>
            </div>
          </div>
          <ul className="list-plain grid grid-4">
            {HOME_PURPOSES.map(({ key, desc }) => (
              <li key={key}>
                <Link href={`/subsidies/purpose/${encodeURIComponent(key)}/`} className="card card-link purpose-tile">
                  <strong className="card-title">{purposeLabel(key)}の補助金</strong>
                  <span>{desc}</span>
                  <span style={{ color: "var(--green-dark)", fontWeight: 700 }}>
                    {activeCount((s) => s.purposes.includes(key))}件
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="section" id="prefectures">
        <div className="container">
          <div className="section-head">
            <div>
              <h2 className="section-title">都道府県から探す</h2>
              <p className="section-lead">各都道府県の制度と、全国で使える国の制度をまとめて確認できます</p>
            </div>
            <Link href="/subsidies/?prefecture=national" className="link-more">
              国の補助金（全国対象）→
            </Link>
          </div>
          <div className="card" style={{ paddingTop: ".5rem", paddingBottom: ".5rem" }}>
            {Object.entries(AREA_PREFECTURES).map(([area, prefectures]) => (
              <div key={area} className="area-block">
                <h3 className="area-name">{area}</h3>
                <ul className="list-plain chip-group">
                  {prefectures.map((p) => (
                    <li key={p}>
                      <Link href={`/subsidies/prefecture/${encodeURIComponent(p)}/`} className="chip">
                        {p}
                        <span style={{ color: "var(--text-muted)", fontSize: ".75rem", marginLeft: ".3rem" }}>
                          {activeCount((s) => matchesPrefecture(s, p))}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <p className="section-lead" style={{ marginTop: ".75rem" }}>
            ※ 市区町村の制度は、各都道府県ページで制度名・対象地域からご確認ください。
          </p>
        </div>
      </section>

      <section className="section section--alt">
        <div className="container">
          <div className="grid grid-2" style={{ gap: "2rem" }}>
            <div>
              <div className="section-head">
                <h2 className="section-title">新たに受付開始した補助金</h2>
                <Link href="/subsidies/open/" className="link-more">
                  受付中の補助金 →
                </Link>
              </div>
              <SubsidyLinkList items={latestOpen} />
            </div>
            <div>
              <div className="section-head">
                <h2 className="section-title">公募予定の補助金</h2>
                <Link href="/subsidies/upcoming/" className="link-more">
                  公募予定の補助金 →
                </Link>
              </div>
              <SubsidyLinkList items={upcoming} />
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-head">
            <h2 className="section-title">テーマ別特集</h2>
          </div>
          <ul className="list-plain grid grid-3">
            {[
              {
                href: "/features/popular-sme/",
                title: "中小企業の定番補助金",
                desc: "ものづくり補助金など、全業種で使われることの多い代表的な制度をまとめています。",
              },
              {
                href: "/features/it-companies/",
                title: "IT・小規模事業者向け補助金",
                desc: "クラウド化・システム導入・DX推進など、デジタル化に使える制度の特集です。",
              },
              {
                href: "/subsidies/industry/製造業/",
                title: "製造業の補助金",
                desc: "設備投資・省エネ・研究開発など、製造業が対象となる制度の一覧です。",
              },
            ].map((f) => (
              <li key={f.href}>
                <Link href={f.href} className="card card-link" style={{ height: "100%" }}>
                  <span className="badge badge-navy" style={{ marginBottom: ".5rem" }}>
                    特集
                  </span>
                  <p className="card-title">{f.title}</p>
                  <p style={{ color: "var(--text-muted)", fontSize: ".85rem", marginTop: ".35rem" }}>{f.desc}</p>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="section section--alt">
        <div className="container">
          <div className="grid grid-2" style={{ gap: "2rem", alignItems: "start" }}>
            <div>
              <div className="section-head">
                <h2 className="section-title">申請ガイド</h2>
                <Link href="/guides/" className="link-more">
                  ガイド一覧 →
                </Link>
              </div>
              <ul className="list-plain grid">
                {guides.slice(0, 5).map((g) => (
                  <li key={g.id}>
                    <Link href={`/guides/${g.id}/`} className="card card-link">
                      <p className="card-title" style={{ fontSize: ".95rem" }}>
                        {g.title}
                      </p>
                      <p className="card-text">{g.summary}</p>
                    </Link>
                  </li>
                ))}
                <li>
                  <Link href="/cases/" className="card card-link">
                    <p className="card-title" style={{ fontSize: ".95rem" }}>
                      補助金の申請事例
                    </p>
                    <p className="card-text">実際に補助金を活用した企業の取り組み事例を紹介しています。</p>
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <FaqSection items={HOME_FAQ} title="補助金のよくある質問" />
            </div>
          </div>
        </div>
      </section>
    </>
  )
}

export default Page
