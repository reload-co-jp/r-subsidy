import { FC } from "react"
import { Suspense } from "react"
import fs from "fs"
import path from "path"
import type { Metadata } from "next"
import Link from "next/link"
import { PREFECTURES } from "../../lib/prefectures"
import type { SubsidyIndexItem } from "../../lib/types"
import { SITE_NAME, absoluteUrl } from "../../lib/site"
import { Breadcrumb } from "../../components/elements/breadcrumb"
import SubsidiesListClient from "./subsidies-list-client"

function getSubsidies(): SubsidyIndexItem[] {
  try {
    const file = path.join(process.cwd(), "data", "generated", "subsidies-index.json")
    return JSON.parse(fs.readFileSync(file, "utf-8"))
  } catch {
    return []
  }
}

const PAGE_TITLE = `補助金一覧 | ${SITE_NAME}`
const PAGE_DESCRIPTION =
  "中小企業・個人事業主向けの補助金をJグランツから一覧で掲載。都道府県・受付状態・用途・補助上限額で絞り込み、制度を比較できます。"
const PAGE_URL = absoluteUrl("/subsidies/")

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  alternates: {
    canonical: PAGE_URL,
  },
  openGraph: {
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
    url: PAGE_URL,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
  },
}

const Page: FC = () => {
  const subsidies = getSubsidies()
  const structuredData = [
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: "補助金一覧",
      url: PAGE_URL,
      inLanguage: "ja",
      description: PAGE_DESCRIPTION,
      numberOfItems: subsidies.length,
      breadcrumb: {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "ホーム", item: absoluteUrl("/") },
          { "@type": "ListItem", position: 2, name: "補助金一覧", item: PAGE_URL },
        ],
      },
    },
  ]

  return (
    <div style={{ maxWidth: "900px", margin: "0 auto" }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <Breadcrumb
        items={[
          { label: "ホーム", href: "/" },
          { label: "補助金一覧" },
        ]}
      />
      <div style={{ marginBottom: "1.5rem" }}>
        <h1 style={{ color: "var(--text-strong)", fontSize: "1.4rem", marginBottom: ".5rem" }}>
          補助金一覧
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: ".875rem" }}>
          {subsidies.length > 0 ? `${subsidies.length}件の補助金` : "データが未取得です。pnpm subsidies:update を実行してください。"}
        </p>
      </div>

      <section style={{ marginBottom: "1.5rem", color: "var(--text-base)", fontSize: ".92rem", lineHeight: 1.8 }}>
        <p style={{ marginBottom: ".7rem" }}>
          中小企業・個人事業主向けの補助金を一覧で確認できるページです。設備投資、デジタル化、人材育成、販路拡大など、
          目的別に制度の概要を比較できます。
        </p>
        <p>
          気になる制度は詳細ページで対象条件や補助率、上限額、申請窓口を確認できます。
        </p>
      </section>

      <section
        style={{
          backgroundColor: "var(--bg-surface)",
          border: "1px solid var(--border-soft)",
          borderRadius: "10px",
          padding: "1rem",
          marginBottom: "1.5rem",
        }}
      >
        <h2 style={{ color: "var(--text-strong)", fontSize: "1rem", marginBottom: ".8rem" }}>
          都道府県別の補助金一覧
        </h2>
        <div style={{ display: "flex", flexWrap: "wrap", gap: ".45rem" }}>
          {PREFECTURES.map((prefecture) => (
            <Link
              key={prefecture}
              href={`/subsidies/prefecture/${encodeURIComponent(prefecture)}`}
              style={{
                backgroundColor: "var(--bg-surface-alt)",
                border: "1px solid var(--border-soft)",
                borderRadius: "999px",
                color: "var(--text-base)",
                fontSize: ".8rem",
                padding: ".36rem .62rem",
                textDecoration: "none",
              }}
            >
              {prefecture}
            </Link>
          ))}
        </div>
      </section>

      <Suspense fallback={null}>
        <SubsidiesListClient subsidies={subsidies} />
      </Suspense>
    </div>
  )
}

export default Page
