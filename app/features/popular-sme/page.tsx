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
    desc: "製造業に限らず全業種の設備投資・システム構築・DX推進に対応。上限最大4,000万円。毎年複数回の公募があり採択件数が多い定番補助金。",
    purposes: ["設備投資", "デジタル化", "研究開発"],
  },
  {
    label: "事業再構築補助金",
    desc: "新分野展開・業態転換・事業再編など思い切った事業変革を補助。全業種対象で上限最大1億5,000万円。採択数累計5万件超の大型補助金。",
    purposes: ["設備投資", "販路拡大", "デジタル化"],
  },
  {
    label: "IT導入補助金",
    desc: "会計・在庫・顧客管理など業務効率化ツールの導入費を補助。全業種の中小企業・小規模事業者が対象で上限最大450万円。",
    purposes: ["デジタル化"],
  },
  {
    label: "小規模事業者持続化補助金",
    desc: "販路開拓・ウェブサイト制作・チラシ作成など販売促進活動を広く補助。従業員20名以下の小規模事業者向けで上限50〜200万円。",
    purposes: ["販路拡大"],
  },
  {
    label: "働き方改革推進支援助成金",
    desc: "時間外労働削減・テレワーク環境整備など働き方改革の取組を支援。全業種の中小企業が対象で上限最大1,370万円。",
    purposes: ["人材育成"],
  },
]

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
        <div style={{ display: "grid", gap: ".85rem" }}>
          {FEATURED_SUBSIDIES.map((item, i) => (
            <div key={item.label} style={{ display: "flex", gap: ".75rem", alignItems: "flex-start" }}>
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
              <div>
                <p
                  style={{
                    color: "var(--text-strong)",
                    fontSize: ".9rem",
                    fontWeight: "bold",
                    marginBottom: ".2rem",
                  }}
                >
                  {item.label}
                </p>
                <p style={{ color: "var(--text-muted)", fontSize: ".8rem", lineHeight: 1.6, marginBottom: ".4rem" }}>
                  {item.desc}
                </p>
                <div style={{ display: "flex", gap: ".3rem", flexWrap: "wrap" }}>
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
