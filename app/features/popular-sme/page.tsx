import { FC, Suspense } from "react"
import fs from "fs"
import path from "path"
import type { Metadata } from "next"
import Link from "next/link"
import type { SubsidyIndexItem } from "../../../lib/types"
import { SITE_NAME, absoluteUrl } from "../../../lib/site"
import { Breadcrumb } from "../../../components/elements/breadcrumb"
import SubsidiesListClient from "../../subsidies/subsidies-list-client"

const PAGE_TITLE = "全業種対応・採択数が多い中小企業向け補助金特集"
const PAGE_DESCRIPTION =
  "業種を問わず中小企業・個人事業主が申請できる、採択実績が豊富な補助金を厳選。ものづくり補助金・事業再構築補助金・IT導入補助金など定番制度を受付状況とあわせて掲載しています。"
const PAGE_URL = absoluteUrl("/features/popular-sme/")

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  alternates: {
    canonical: PAGE_URL,
  },
  openGraph: {
    title: `${PAGE_TITLE} | ${SITE_NAME}`,
    description: PAGE_DESCRIPTION,
    url: PAGE_URL,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: `${PAGE_TITLE} | ${SITE_NAME}`,
    description: PAGE_DESCRIPTION,
  },
}

function getSubsidies(): SubsidyIndexItem[] {
  try {
    const file = path.join(process.cwd(), "data", "generated", "subsidies-index.json")
    return JSON.parse(fs.readFileSync(file, "utf-8"))
  } catch {
    return []
  }
}

function getPopularSmeSubsidies(all: SubsidyIndexItem[]): SubsidyIndexItem[] {
  return all.filter(
    (s) =>
      s.isForSME &&
      s.region === "national" &&
      (s.status === "open" || s.status === "upcoming")
  )
}

const FEATURED_SUBSIDIES = [
  {
    label: "ものづくり・商業・サービス生産性向上促進補助金",
    href: "/subsidies/a0wj200000cdvkemah",
    amount: "最大750万〜4,000万円",
    recommend: 5,
    ease: 3,
    requirements: "全業種の中小企業・小規模事業者。革新的な設備投資・サービス開発計画が必要。付加価値額年率3%以上向上計画必須。",
    note: "毎年複数回公募。採択件数が多く実績豊富な定番補助金。",
    purposes: ["設備投資", "デジタル化", "研究開発"],
    lawyerComment: "事業計画書の付加価値額・給与支給総額の数値根拠が審査の核心です。認定支援機関との計画策定を早期に開始し、補助事業期間内の達成スケジュールを具体的に示してください。賃上げ要件は補助事業実施後も継続義務があるため、計画の実現可能性を慎重に検討してください。",
  },
  {
    label: "事業再構築補助金",
    href: "/subsidies?q=事業再構築補助金",
    amount: "最大3,000万〜1億5,000万円",
    recommend: 4,
    ease: 2,
    requirements: "売上・付加価値額減少要件あり。新分野展開・業態転換・事業再編など大きな変革が必要。",
    note: "採択数累計5万件超の大型補助金。現在は後継枠・新制度に移行中のため最新情報確認必須。",
    purposes: ["設備投資", "販路拡大", "デジタル化"],
    lawyerComment: "現行制度から新枠への移行期にあります。最新公募要領で売上減少・付加価値額要件を確認し、新分野展開の市場規模・競合分析を事業計画に盛り込んでください。補助事業期間が終了しても付加価値額・給与支給総額の目標達成義務が続く点に注意が必要です。",
  },
  {
    label: "IT導入補助金",
    href: "/subsidies?q=IT導入補助金",
    amount: "5万〜450万円（セキュリティ枠 最大1,500万円）",
    recommend: 5,
    ease: 4,
    requirements: "全業種の中小企業・小規模事業者。認定ITベンダーが提供するツールの導入が必要。",
    note: "会計・在庫・顧客管理などSaaSツール導入費を補助。手続きが比較的シンプルで取りやすい。",
    purposes: ["デジタル化"],
    lawyerComment: "登録済みITツール・IT導入支援事業者の選定が申請の前提です。ツールが補助対象として登録されているかJグランツで事前確認し、支援事業者と早めに連絡を取ってください。交付申請は導入前に完了させる必要があり、先行発注・契約は補助対象外となります。",
  },
  {
    label: "小規模事業者持続化補助金",
    href: "/subsidies?q=持続化補助金",
    amount: "最大50〜200万円",
    recommend: 4,
    ease: 5,
    requirements: "常時使用従業員20名以下（商業・サービス業は5名以下）の小規模事業者。",
    note: "HP制作・チラシ・広告費・展示会出展など販路開拓全般に使える。採択率が高く申請ハードル低め。",
    purposes: ["販路拡大"],
    lawyerComment: "商工会・商工会議所の支援を受けて経営計画書を作成することが申請要件です。補助事業実施期間内に発注・支払・納品を完了させる必要があります。HP制作費は全額対象とならないケースもあるため、対象経費の範囲を公募要領で確認してください。",
  },
  {
    label: "働き方改革推進支援助成金",
    href: "/subsidies/a0wj200000cdyegma5",
    amount: "最大1,370万円",
    recommend: 4,
    ease: 4,
    requirements: "全業種の中小企業。時間外労働削減・テレワーク環境整備などの取組計画が必要。",
    note: "テレワーク導入・勤怠管理システム整備など幅広い用途に対応。",
    purposes: ["人材育成"],
    lawyerComment: "36協定の締結・届出が前提要件です。就業規則の改定・労使協定の整備が必要な場合があります。設備導入前に交付決定を受ける必要があるため、先行発注は補助対象外となります。申請前に労働局または社会保険労務士への相談を推奨します。",
  },
]

function renderStars(count: number, max = 5): string {
  return "★".repeat(count) + "☆".repeat(max - count)
}

const Page: FC = () => {
  const all = getSubsidies()
  const popularSubsidies = getPopularSmeSubsidies(all)
  const openCount = popularSubsidies.filter((s) => s.status === "open").length
  const upcomingCount = popularSubsidies.filter((s) => s.status === "upcoming").length

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: PAGE_TITLE,
    url: PAGE_URL,
    inLanguage: "ja",
    description: PAGE_DESCRIPTION,
    numberOfItems: popularSubsidies.length,
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "ホーム", item: absoluteUrl("/") },
        { "@type": "ListItem", position: 2, name: "補助金一覧", item: absoluteUrl("/subsidies/") },
        { "@type": "ListItem", position: 3, name: PAGE_TITLE, item: PAGE_URL },
      ],
    },
  }

  return (
    <div style={{ maxWidth: "900px", margin: "0 auto" }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <Breadcrumb
        items={[
          { label: "ホーム", href: "/" },
          { label: "補助金一覧", href: "/subsidies" },
          { label: PAGE_TITLE },
        ]}
      />

      <div style={{ marginBottom: "2rem" }}>
        <p style={{ color: "#38b48b", fontSize: ".82rem", fontWeight: "bold", marginBottom: ".45rem" }}>
          特集
        </p>
        <h1
          style={{
            color: "var(--text-strong)",
            fontSize: "1.55rem",
            lineHeight: 1.4,
            marginBottom: ".65rem",
          }}
        >
          {PAGE_TITLE}
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: ".9rem", lineHeight: 1.8 }}>
          業種・地域を問わず申請できる全国対応の補助金を受付状況つきで掲載しています。
          {(openCount > 0 || upcomingCount > 0) && (
            <>
              {" "}現在{" "}
              {openCount > 0 && (
                <><strong style={{ color: "#22c55e" }}>{openCount}件</strong>が受付中</>
              )}
              {openCount > 0 && upcomingCount > 0 && "・"}
              {upcomingCount > 0 && (
                <><strong style={{ color: "#f59e0b" }}>{upcomingCount}件</strong>が公募前</>
              )}
              です。
            </>
          )}
        </p>
      </div>

      <section
        style={{
          backgroundColor: "var(--bg-surface)",
          border: "1px solid var(--border-soft)",
          borderRadius: "10px",
          padding: "1.25rem",
          marginBottom: "2rem",
        }}
      >
        <h2
          style={{ color: "var(--text-strong)", fontSize: "1rem", marginBottom: "1rem" }}
        >
          採択数が多い定番補助金5選
        </h2>
        <div style={{ display: "grid", gap: "1rem" }}>
          {FEATURED_SUBSIDIES.map((item, i) => (
            <div
              key={item.label}
              style={{
                display: "flex",
                gap: ".75rem",
                alignItems: "flex-start",
                borderBottom: i < FEATURED_SUBSIDIES.length - 1 ? "1px solid var(--border-soft)" : "none",
                paddingBottom: i < FEATURED_SUBSIDIES.length - 1 ? "1rem" : "0",
              }}
            >
              <span
                style={{
                  backgroundColor: "#38b48b22",
                  color: "#38b48b",
                  border: "1px solid #38b48b44",
                  borderRadius: "4px",
                  padding: ".1rem .45rem",
                  fontSize: ".72rem",
                  fontWeight: "bold",
                  whiteSpace: "nowrap",
                  flexShrink: 0,
                  marginTop: ".15rem",
                  minWidth: "1.6rem",
                  textAlign: "center",
                }}
              >
                {i + 1}
              </span>
              <div style={{ flex: 1 }}>
                <p
                  style={{
                    color: "var(--text-strong)",
                    fontSize: ".9rem",
                    fontWeight: "bold",
                    marginBottom: ".35rem",
                  }}
                >
                  <Link
                    href={item.href}
                    style={{ color: "inherit", textDecoration: "underline", textDecorationColor: "var(--border-soft)" }}
                  >
                    {item.label}
                  </Link>
                </p>
                <div
                  style={{
                    display: "flex",
                    gap: "1rem",
                    flexWrap: "wrap",
                    marginBottom: ".35rem",
                    fontSize: ".75rem",
                  }}
                >
                  <span>
                    <span style={{ color: "var(--text-muted)" }}>おすすめ度 </span>
                    <span style={{ color: "#f59e0b", letterSpacing: ".05em" }}>{renderStars(item.recommend)}</span>
                  </span>
                  <span>
                    <span style={{ color: "var(--text-muted)" }}>取りやすさ </span>
                    <span style={{ color: "#38b48b", letterSpacing: ".05em" }}>{renderStars(item.ease)}</span>
                  </span>
                  <span style={{ color: "var(--text-muted)" }}>
                    補助額：<strong style={{ color: "var(--text-strong)" }}>{item.amount}</strong>
                  </span>
                </div>
                <p style={{ color: "var(--text-muted)", fontSize: ".8rem", lineHeight: 1.6, marginBottom: ".3rem" }}>
                  <strong style={{ color: "var(--text-strong)" }}>要件：</strong>{item.requirements}
                </p>
                <p style={{ color: "var(--text-muted)", fontSize: ".78rem", lineHeight: 1.6, marginBottom: ".4rem" }}>
                  {item.note}
                </p>
                <div style={{ display: "flex", gap: ".3rem", flexWrap: "wrap", marginBottom: item.lawyerComment ? ".5rem" : undefined }}>
                  {item.purposes.map((p) => (
                    <span
                      key={p}
                      style={{
                        backgroundColor: "var(--bg-base)",
                        border: "1px solid var(--border-soft)",
                        borderRadius: "999px",
                        padding: ".1rem .5rem",
                        fontSize: ".7rem",
                        color: "var(--text-muted)",
                      }}
                    >
                      {p}
                    </span>
                  ))}
                </div>
                {item.lawyerComment && (
                  <div
                    style={{
                      backgroundColor: "#f0fdf8",
                      border: "1px solid #a7f3d0",
                      borderRadius: "6px",
                      padding: ".6rem .8rem",
                    }}
                  >
                    <span
                      style={{
                        color: "#059669",
                        fontSize: ".72rem",
                        fontWeight: "bold",
                        display: "block",
                        marginBottom: ".25rem",
                      }}
                    >
                      行政書士コメント
                    </span>
                    <p
                      style={{
                        color: "#064e3b",
                        fontSize: ".78rem",
                        lineHeight: 1.6,
                        margin: 0,
                      }}
                    >
                      {item.lawyerComment}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section
        style={{
          backgroundColor: "#fffbeb",
          border: "1px solid #fde68a",
          borderRadius: "10px",
          padding: "1rem 1.25rem",
          marginBottom: "2rem",
          fontSize: ".85rem",
          color: "#78350f",
          lineHeight: 1.8,
        }}
      >
        <strong>申請前チェック：</strong>
        全業種対応の補助金でも、従業員数・資本金・直近の売上要件で受給資格が変わります。
        詳細ページで対象条件を確認の上、申請期限にご注意ください。
        <Link
          href="/diagnosis"
          style={{ color: "#d97706", marginLeft: ".5rem", textDecoration: "underline" }}
        >
          診断で自社に合う補助金を絞り込む →
        </Link>
      </section>

      <Suspense fallback={null}>
        <SubsidiesListClient
          subsidies={popularSubsidies}
          availablePurposes={[...new Set(popularSubsidies.flatMap((s) => s.purposes))].sort()}
        />
      </Suspense>
    </div>
  )
}

export default Page
