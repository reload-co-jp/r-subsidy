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

const CHECKLIST_ITEMS = [
  {
    label: "IT導入補助金（デジタル化ツール導入）",
    desc: "会計・在庫・顧客管理などのSaaSツール導入費用を最大450万円まで補助。",
  },
  {
    label: "事業再構築補助金（デジタル分野での事業転換）",
    desc: "新規事業立ち上げや業態転換に伴うシステム開発・設備投資を補助。",
  },
  {
    label: "小規模事業者持続化補助金",
    desc: "従業員5〜20名以下の小規模事業者のウェブサイト構築・EC化などに利用可。",
  },
  {
    label: "各都道府県のDX推進補助金",
    desc: "地域ごとにクラウド化・テレワーク環境整備などを対象とした補助制度あり。",
  },
]

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
        <div style={{ display: "grid", gap: ".85rem" }}>
          {CHECKLIST_ITEMS.map((item) => (
            <div key={item.label} style={{ display: "flex", gap: ".75rem", alignItems: "flex-start" }}>
              <span
                style={{
                  backgroundColor: "#38b48b22",
                  color: "#38b48b",
                  border: "1px solid #38b48b44",
                  borderRadius: "4px",
                  padding: ".1rem .45rem",
                  fontSize: ".72rem",
                  whiteSpace: "nowrap",
                  flexShrink: 0,
                  marginTop: ".15rem",
                }}
              >
                ✓
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
                <p style={{ color: "var(--text-muted)", fontSize: ".8rem", lineHeight: 1.6 }}>
                  {item.desc}
                </p>
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
