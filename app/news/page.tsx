import { FC, Suspense } from "react"
import fs from "fs"
import path from "path"
import type { Metadata } from "next"
import Link from "next/link"
import { SITE_NAME, absoluteUrl } from "../../lib/site"
import { Breadcrumb } from "../../components/elements/breadcrumb"
import NewsListClient from "./news-list-client"

export type SubsidyNews = {
  id: string
  title: string
  summary: string
  body: string
  category: string
  tags: string[]
  publishedAt: string
  sourceLabel: string
  sourceUrl: string
  relatedSubsidySlugs: string[]
}

function getNews(): SubsidyNews[] {
  try {
    const file = path.join(process.cwd(), "data", "source", "subsidy-news.json")
    return JSON.parse(fs.readFileSync(file, "utf-8"))
  } catch {
    return []
  }
}

const PAGE_TITLE = "補助金 最新ニュース"
const PAGE_DESCRIPTION =
  "中小企業・個人事業主向け補助金の最新情報をお届け。新規公募開始・制度改正・申請締切情報などを週次で更新しています。"
const PAGE_URL = absoluteUrl("/news/")

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  alternates: { canonical: PAGE_URL },
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

const Page: FC = () => {
  const news = getNews()
  const categories = [...new Set(news.map((n) => n.category))].sort()

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: PAGE_TITLE,
    url: PAGE_URL,
    inLanguage: "ja",
    description: PAGE_DESCRIPTION,
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "ホーム", item: absoluteUrl("/") },
        { "@type": "ListItem", position: 2, name: PAGE_TITLE, item: PAGE_URL },
      ],
    },
  }

  return (
    <div className="page-content">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <Breadcrumb
        items={[
          { label: "ホーム", href: "/" },
          { label: "ニュース" },
        ]}
      />

      <div style={{ marginBottom: "1.75rem" }}>
        <h1
          style={{
            color: "var(--text-strong)",
            fontSize: "1.4rem",
            marginBottom: ".5rem",
          }}
        >
          補助金 最新ニュース
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: ".875rem", lineHeight: 1.8 }}>
          中小企業・個人事業主向け補助金の最新情報。新規公募開始・制度改正・申請締切情報を週次更新。
        </p>
      </div>

      <Suspense fallback={null}>
        <NewsListClient news={news} categories={categories} />
      </Suspense>

      <div
        style={{
          marginTop: "2.5rem",
          padding: "1.5rem",
          backgroundColor: "var(--bg-surface)",
          border: "1px solid var(--border-soft)",
          borderRadius: "10px",
          textAlign: "center",
        }}
      >
        <p style={{ color: "var(--text-base)", fontSize: ".9rem", marginBottom: "1rem" }}>
          自社に合う補助金を探してみましょう
        </p>
        <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
          <Link
            href="/diagnosis"
            style={{
              display: "inline-block",
              backgroundColor: "#38b48b",
              color: "#fff",
              padding: ".65rem 1.75rem",
              borderRadius: "8px",
              textDecoration: "none",
              fontWeight: "bold",
              fontSize: ".9rem",
            }}
          >
            補助金診断をする →
          </Link>
          <Link
            href="/subsidies"
            style={{
              display: "inline-block",
              backgroundColor: "var(--bg-surface-alt)",
              color: "var(--text-base)",
              border: "1px solid var(--border-soft)",
              padding: ".65rem 1.75rem",
              borderRadius: "8px",
              textDecoration: "none",
              fontSize: ".9rem",
            }}
          >
            補助金一覧を見る
          </Link>
        </div>
      </div>
    </div>
  )
}

export default Page
