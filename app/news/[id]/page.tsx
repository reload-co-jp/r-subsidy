import { FC } from "react"
import fs from "fs"
import path from "path"
import type { Metadata } from "next"
import Link from "next/link"
import { SITE_NAME, DEFAULT_OG_IMAGE, absoluteUrl } from "../../../lib/site"
import { Breadcrumb } from "../../../components/elements/breadcrumb"
import type { SubsidyNews } from "../page"

export const dynamicParams = false

function getAllNews(): SubsidyNews[] {
  try {
    const file = path.join(process.cwd(), "data", "source", "subsidy-news.json")
    return JSON.parse(fs.readFileSync(file, "utf-8"))
  } catch {
    return []
  }
}

function getNewsItem(id: string): SubsidyNews | null {
  return getAllNews().find((n) => n.id === id) ?? null
}

export function generateStaticParams(): { id: string }[] {
  return getAllNews().map((n) => ({ id: n.id }))
}

type Props = { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const item = getNewsItem(id)

  if (!item) {
    return {
      title: `記事が見つかりません | ${SITE_NAME}`,
      robots: { index: false, follow: false },
    }
  }

  const pageUrl = absoluteUrl(`/news/${item.id}/`)
  const ogImage = { url: absoluteUrl(DEFAULT_OG_IMAGE), width: 1200, height: 630, alt: item.title }

  return {
    title: item.title,
    description: item.summary,
    alternates: { canonical: pageUrl },
    openGraph: {
      title: `${item.title} | ${SITE_NAME}`,
      description: item.summary,
      url: pageUrl,
      type: "article",
      publishedTime: item.publishedAt,
      images: [ogImage],
    },
    twitter: {
      card: "summary_large_image",
      title: `${item.title} | ${SITE_NAME}`,
      description: item.summary,
      images: [ogImage.url],
    },
  }
}

const Page: FC<Props> = async ({ params }) => {
  const { id } = await params
  const item = getNewsItem(id)

  if (!item) {
    return (
      <div style={{ maxWidth: "800px", margin: "0 auto", textAlign: "center", padding: "4rem 0" }}>
        <p style={{ color: "var(--text-muted)", marginBottom: "1rem" }}>
          記事が見つかりませんでした
        </p>
        <Link href="/news" style={{ color: "#38b48b", textDecoration: "none", fontSize: ".875rem" }}>
          ← ニュース一覧に戻る
        </Link>
      </div>
    )
  }

  const pageUrl = absoluteUrl(`/news/${item.id}/`)

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: item.title,
    description: item.summary,
    url: pageUrl,
    inLanguage: "ja",
    datePublished: item.publishedAt,
    dateModified: item.publishedAt,
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      url: absoluteUrl("/"),
    },
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "ホーム", item: absoluteUrl("/") },
        { "@type": "ListItem", position: 2, name: "ニュース", item: absoluteUrl("/news/") },
        { "@type": "ListItem", position: 3, name: item.title, item: pageUrl },
      ],
    },
  }

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto" }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <Breadcrumb
        items={[
          { label: "ホーム", href: "/" },
          { label: "ニュース", href: "/news" },
          { label: item.title },
        ]}
      />

      <div
        style={{
          backgroundColor: "var(--bg-surface)",
          borderRadius: "10px",
          padding: "1.5rem",
          border: "1px solid var(--border-soft)",
          marginBottom: "1.5rem",
        }}
      >
        <div style={{ display: "flex", gap: ".5rem", flexWrap: "wrap", marginBottom: "1rem" }}>
          <span
            style={{
              backgroundColor: "#38b48b22",
              color: "#38b48b",
              border: "1px solid #38b48b44",
              borderRadius: "4px",
              padding: ".2rem .6rem",
              fontSize: ".8rem",
              fontWeight: "bold",
            }}
          >
            {item.category}
          </span>
          <span style={{ color: "var(--text-muted)", fontSize: ".8rem", alignSelf: "center" }}>
            {item.publishedAt}
          </span>
        </div>

        <h1
          style={{
            color: "var(--text-strong)",
            fontSize: "1.4rem",
            fontWeight: "bold",
            lineHeight: 1.5,
            marginBottom: "1rem",
          }}
        >
          {item.title}
        </h1>

        <p
          style={{
            color: "var(--text-muted)",
            fontSize: ".9rem",
            lineHeight: 1.7,
            borderLeft: "3px solid #38b48b",
            paddingLeft: "1rem",
            marginBottom: "1.5rem",
          }}
        >
          {item.summary}
        </p>

        <div
          style={{
            color: "var(--text-base)",
            fontSize: ".9rem",
            lineHeight: 1.8,
            whiteSpace: "pre-wrap",
          }}
        >
          {item.body}
        </div>
      </div>

      {item.tags.length > 0 && (
        <div style={{ display: "flex", gap: ".4rem", flexWrap: "wrap", marginBottom: "1.5rem" }}>
          {item.tags.map((tag) => (
            <span
              key={tag}
              style={{
                backgroundColor: "var(--bg-surface-alt)",
                color: "var(--text-muted)",
                borderRadius: "4px",
                padding: ".2rem .6rem",
                fontSize: ".75rem",
              }}
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      {item.relatedSubsidySlugs.length > 0 && (
        <div
          style={{
            backgroundColor: "var(--bg-surface)",
            borderRadius: "10px",
            padding: "1.25rem",
            border: "1px solid var(--border-soft)",
            marginBottom: "1.5rem",
          }}
        >
          <h2 style={{ color: "var(--text-muted)", fontSize: ".8rem", marginBottom: ".75rem" }}>
            関連補助金
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: ".5rem" }}>
            {item.relatedSubsidySlugs.map((slug) => (
              <Link
                key={slug}
                href={`/subsidies/${slug}`}
                style={{
                  color: "#38b48b",
                  textDecoration: "none",
                  fontSize: ".875rem",
                }}
              >
                → {slug}
              </Link>
            ))}
          </div>
        </div>
      )}

      <div
        style={{
          borderTop: "1px solid var(--border-soft)",
          paddingTop: ".75rem",
          marginBottom: "1.5rem",
        }}
      >
        <a
          href={item.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: "var(--text-muted)", fontSize: ".75rem", textDecoration: "none" }}
        >
          出典: {item.sourceLabel} ↗
        </a>
      </div>

      <div style={{ textAlign: "center" }}>
        <Link
          href="/news"
          style={{ color: "var(--text-muted)", textDecoration: "none", fontSize: ".875rem" }}
        >
          ← ニュース一覧に戻る
        </Link>
      </div>
    </div>
  )
}

export default Page
