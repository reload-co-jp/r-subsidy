import { FC, Suspense } from "react"
import fs from "fs"
import path from "path"
import type { Metadata } from "next"
import Link from "next/link"
import type { SubsidyIndexItem } from "../../../lib/types"
import { SITE_NAME, absoluteUrl } from "../../../lib/site"
import { Breadcrumb } from "../../../components/elements/breadcrumb"
import SubsidiesListClient from "../../subsidies/subsidies-list-client"

const PAGE_TITLE = "IT系・零細企業向け補助金特集"
const PAGE_DESCRIPTION =
  "IT企業・情報通信業・デジタル化を進めたい零細企業向けの補助金を一覧で掲載。システム導入、クラウド化、DX推進に使える制度を比較できます。"
const PAGE_URL = absoluteUrl("/features/it-companies/")

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

function getItSubsidies(all: SubsidyIndexItem[]): SubsidyIndexItem[] {
  return all.filter(
    (s) =>
      s.purposes.includes("デジタル化") ||
      (s.industries && s.industries.includes("情報通信業"))
  )
}

const IT_SUBSIDIES = [
  {
    label: "IT導入補助金",
    amount: "5万〜450万円（セキュリティ枠 最大1,500万円）",
    recommend: 5,
    ease: 4,
    requirements: "中小企業・小規模事業者。認定ITベンダーのツール導入が必要。",
    note: "IT企業は「提供側（ベンダー登録）」として活用する戦略が有効。自社サービス開発には使えない。",
    purposes: ["デジタル化"],
  },
  {
    label: "ものづくり補助金",
    amount: "750万〜1,250万円（省力化枠 最大1,500万円）",
    recommend: 4,
    ease: 3,
    requirements: "革新的サービス開発・生産プロセス改善。付加価値額年率3%以上向上計画必須。",
    note: "システム開発・DXツール自社開発に使いやすい。",
    purposes: ["設備投資", "デジタル化"],
  },
  {
    label: "小規模事業者持続化補助金",
    amount: "最大200万円",
    recommend: 3,
    ease: 5,
    requirements: "常時使用従業員5名以下（サービス業）。",
    note: "HP制作・広告費・展示会出展に活用可。手軽だが額は小さい。",
    purposes: ["販路拡大"],
  },
  {
    label: "キャリアアップ助成金",
    amount: "1人あたり最大80万円",
    recommend: 4,
    ease: 4,
    requirements: "非正規→正社員転換、または賃金引上げ。雇用保険適用事業所。",
    note: "エンジニア採用・正社員化で活用しやすい。",
    purposes: ["人材育成"],
  },
  {
    label: "人材開発支援助成金",
    amount: "訓練費用の45〜75%（上限あり）",
    recommend: 4,
    ease: 4,
    requirements: "社員への職業訓練実施。訓練計画届出必須。",
    note: "エンジニア研修・資格取得費用に直接使える。",
    purposes: ["人材育成"],
  },
  {
    label: "NEDO補助金（研究開発系）",
    amount: "数百万〜数億円",
    recommend: 4,
    ease: 2,
    requirements: "技術開発テーマが公募課題に合致必要。提案書・実施計画の精度高く求められる。",
    note: "AI・IoT・DX系スタートアップに強い。採択率低いが額大きい。",
    purposes: ["研究開発", "デジタル化"],
  },
  {
    label: "事業再構築補助金",
    amount: "最大3,000万〜1億円",
    recommend: 3,
    ease: 2,
    requirements: "売上・付加価値額減少要件あり。新分野展開・業態転換が必要。",
    note: "後継枠・新制度に移行中。最新情報確認必須。",
    purposes: ["設備投資", "デジタル化"],
  },
]

function renderStars(count: number, max = 5): string {
  return "★".repeat(count) + "☆".repeat(max - count)
}

const Page: FC = () => {
  const all = getSubsidies()
  const itSubsidies = getItSubsidies(all)
  const openCount = itSubsidies.filter((s) => s.status === "open" || s.status === "upcoming").length

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: PAGE_TITLE,
    url: PAGE_URL,
    inLanguage: "ja",
    description: PAGE_DESCRIPTION,
    numberOfItems: itSubsidies.length,
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
          IT企業・情報通信業・デジタル化を検討している零細企業向けに絞り込んだ補助金一覧です。
          {openCount > 0 && (
            <> 現在 <strong style={{ color: "#22c55e" }}>{openCount}件</strong> が受付中・公募前です。</>
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
          IT系企業が活用できる主な補助金
        </h2>
        <div style={{ display: "grid", gap: "1rem" }}>
          {IT_SUBSIDIES.map((item, i) => (
            <div
              key={item.label}
              style={{
                display: "flex",
                gap: ".75rem",
                alignItems: "flex-start",
                borderBottom: i < IT_SUBSIDIES.length - 1 ? "1px solid var(--border-soft)" : "none",
                paddingBottom: i < IT_SUBSIDIES.length - 1 ? "1rem" : "0",
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
                  {item.label}
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
        <strong>申請のポイント：</strong>
        IT補助金は「デジタル化・DX推進」目的に加え、対象従業員数・業種・都道府県で受給可否が変わります。
        詳細ページで対象条件を必ず確認してください。
        <Link
          href="/diagnosis"
          style={{ color: "#d97706", marginLeft: ".5rem", textDecoration: "underline" }}
        >
          診断で自社に合う補助金を絞り込む →
        </Link>
      </section>

      <Suspense fallback={null}>
        <SubsidiesListClient
          subsidies={itSubsidies}
          availablePurposes={[...new Set(itSubsidies.flatMap((s) => s.purposes))].sort()}
        />
      </Suspense>
    </div>
  )
}

export default Page
