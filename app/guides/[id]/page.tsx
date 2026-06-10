import { FC } from "react"
import fs from "fs"
import path from "path"
import type { Metadata } from "next"
import Link from "next/link"
import ReactMarkdown from "react-markdown"
import { SITE_NAME, DEFAULT_OG_IMAGE, absoluteUrl } from "../../../lib/site"
import { Breadcrumb } from "../../../components/elements/breadcrumb"
import type { Guide } from "../page"
import type { SubsidyIndexItem } from "../../../lib/types"

export const dynamicParams = false

function getAllGuides(): Guide[] {
  try {
    const file = path.join(process.cwd(), "data", "source", "guides.json")
    return JSON.parse(fs.readFileSync(file, "utf-8"))
  } catch {
    return []
  }
}

function getGuide(id: string): Guide | null {
  return getAllGuides().find((g) => g.id === id) ?? null
}

function getSubsidyTitle(slug: string): string {
  try {
    const file = path.join(process.cwd(), "data", "generated", "subsidies-index.json")
    const subsidies: SubsidyIndexItem[] = JSON.parse(fs.readFileSync(file, "utf-8"))
    return subsidies.find((s) => s.slug === slug)?.title ?? slug
  } catch {
    return slug
  }
}

export function generateStaticParams(): { id: string }[] {
  return getAllGuides().map((g) => ({ id: g.id }))
}

type Props = { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const item = getGuide(id)

  if (!item) {
    return {
      title: `記事が見つかりません | ${SITE_NAME}`,
      robots: { index: false, follow: false },
    }
  }

  const pageUrl = absoluteUrl(`/guides/${item.id}/`)
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
  const item = getGuide(id)

  if (!item) {
    return (
      <div style={{ maxWidth: "800px", margin: "0 auto", textAlign: "center", padding: "4rem 0" }}>
        <p style={{ color: "var(--text-muted)", marginBottom: "1rem" }}>
          記事が見つかりませんでした
        </p>
        <Link href="/guides" style={{ color: "#38b48b", textDecoration: "none", fontSize: ".875rem" }}>
          ← 申請ガイド一覧に戻る
        </Link>
      </div>
    )
  }

  const pageUrl = absoluteUrl(`/guides/${item.id}/`)

  const publisherOrg = {
    "@type": "Organization",
    name: SITE_NAME,
    url: absoluteUrl("/"),
  }

  const breadcrumbList = {
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "ホーム", item: absoluteUrl("/") },
      { "@type": "ListItem", position: 2, name: "申請ガイド", item: absoluteUrl("/guides/") },
      { "@type": "ListItem", position: 3, name: item.title, item: pageUrl },
    ],
  }

  const articleData = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: item.title,
    description: item.summary,
    url: pageUrl,
    inLanguage: "ja",
    datePublished: item.publishedAt,
    dateModified: item.publishedAt,
    image: [absoluteUrl(DEFAULT_OG_IMAGE)],
    author: publisherOrg,
    publisher: publisherOrg,
    breadcrumb: breadcrumbList,
  }

  const howToSteps = item.body
    .split("\n")
    .filter((line) => /^\*\*STEP\d+[：:]/.test(line))
    .map((line, i) => ({
      "@type": "HowToStep",
      position: i + 1,
      name: line.replace(/^\*\*/, "").replace(/\*\*$/, "").replace(/^STEP\d+[：:]\s*/, ""),
      text: line.replace(/^\*\*/, "").replace(/\*\*$/, ""),
    }))

  const howToData = howToSteps.length > 0
    ? {
        "@context": "https://schema.org",
        "@type": "HowTo",
        name: item.title,
        description: item.summary,
        inLanguage: "ja",
        step: howToSteps,
      }
    : null

  const structuredData = howToData ?? articleData

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto" }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleData) }}
      />
      {howToData && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(howToData) }}
        />
      )}

      <Breadcrumb
        items={[
          { label: "ホーム", href: "/" },
          { label: "申請ガイド", href: "/guides" },
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
              backgroundColor: "#3b82f622",
              color: "#3b82f6",
              border: "1px solid #3b82f644",
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
            borderLeft: "3px solid #3b82f6",
            paddingLeft: "1rem",
            marginBottom: "1.5rem",
          }}
        >
          {item.summary}
        </p>

        <div
          style={{ color: "var(--text-base)" }}
          className="rich-html"
        >
          <ReactMarkdown>{item.body}</ReactMarkdown>
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
                → {getSubsidyTitle(slug)}
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
          href="/guides"
          style={{ color: "var(--text-muted)", textDecoration: "none", fontSize: ".875rem" }}
        >
          ← 申請ガイド一覧に戻る
        </Link>
      </div>
    </div>
  )
}

export default Page
