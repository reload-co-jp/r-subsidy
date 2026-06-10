import { FC } from "react"
import fs from "fs"
import path from "path"
import type { Metadata } from "next"
import Link from "next/link"
import { SITE_NAME, absoluteUrl } from "../../lib/site"
import { Breadcrumb } from "../../components/elements/breadcrumb"

export type Guide = {
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

function getGuides(): Guide[] {
  try {
    const file = path.join(process.cwd(), "data", "source", "guides.json")
    return JSON.parse(fs.readFileSync(file, "utf-8"))
  } catch {
    return []
  }
}

const PAGE_TITLE = "補助金 申請ガイド"
const PAGE_DESCRIPTION =
  "中小企業・個人事業主向けに補助金申請の手続きや準備方法をわかりやすく解説した記事一覧。GビズID取得方法・Jグランツの使い方・申請書類の準備など。"
const PAGE_URL = absoluteUrl("/guides/")

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
  const guides = getGuides()

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
    <div style={{ maxWidth: "900px", margin: "0 auto" }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <Breadcrumb
        items={[
          { label: "ホーム", href: "/" },
          { label: "申請ガイド" },
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
          補助金 申請ガイド
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: ".875rem", lineHeight: 1.8 }}>
          補助金申請の手続き・準備方法をわかりやすく解説。GビズID取得・Jグランツの使い方など申請に必要な知識をまとめています。
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        {guides.map((guide) => (
          <Link
            key={guide.id}
            href={`/guides/${guide.id}`}
            style={{ textDecoration: "none" }}
          >
            <div
              style={{
                backgroundColor: "var(--bg-surface)",
                border: "1px solid var(--border-soft)",
                borderRadius: "10px",
                padding: "1.25rem 1.5rem",
                transition: "box-shadow 0.15s",
              }}
            >
              <div style={{ display: "flex", gap: ".5rem", flexWrap: "wrap", marginBottom: ".5rem" }}>
                <span
                  style={{
                    backgroundColor: "#3b82f622",
                    color: "#3b82f6",
                    border: "1px solid #3b82f644",
                    borderRadius: "4px",
                    padding: ".2rem .6rem",
                    fontSize: ".75rem",
                    fontWeight: "bold",
                  }}
                >
                  {guide.category}
                </span>
                <span style={{ color: "var(--text-muted)", fontSize: ".75rem", alignSelf: "center" }}>
                  {guide.publishedAt}
                </span>
              </div>
              <h2
                style={{
                  color: "var(--text-strong)",
                  fontSize: "1rem",
                  fontWeight: "bold",
                  lineHeight: 1.5,
                  marginBottom: ".5rem",
                }}
              >
                {guide.title}
              </h2>
              <p
                style={{
                  color: "var(--text-muted)",
                  fontSize: ".875rem",
                  lineHeight: 1.7,
                  display: "-webkit-box",
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                }}
              >
                {guide.summary}
              </p>
            </div>
          </Link>
        ))}
      </div>

      {guides.length === 0 && (
        <p style={{ color: "var(--text-muted)", textAlign: "center", padding: "3rem 0" }}>
          記事は準備中です
        </p>
      )}

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
