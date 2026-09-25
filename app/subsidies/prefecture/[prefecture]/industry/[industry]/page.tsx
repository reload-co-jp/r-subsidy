import { Suspense } from "react"
import fs from "fs"
import path from "path"
import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { POPULAR_PREFECTURES, isPrefecture, matchesPrefecture } from "../../../../../../lib/prefectures"
import { SITE_NAME, absoluteUrl, buildBreadcrumbList } from "../../../../../../lib/site"
import type { SubsidyIndexItem } from "../../../../../../lib/types"
import { Breadcrumb } from "../../../../../../components/elements/breadcrumb"
import FaqSection, { buildFaqStructuredData } from "../../../../../../components/elements/faq-section"
import { buildCollectionFaqItems } from "../../../../../../lib/collection-faq"
import SubsidiesListClient from "../../../../subsidies-list-client"
import { POPULAR_INDUSTRIES } from "../../../../../../lib/industries"
import { indexRobots, isLocalTo } from "../../../../../../lib/seo"

export const dynamicParams = false

type Props = { params: Promise<{ prefecture: string; industry: string }> }

function decode(value: string) {
  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}

function getSubsidies(): SubsidyIndexItem[] {
  try {
    const file = path.join(process.cwd(), "data", "generated", "subsidies-index.json")
    return JSON.parse(fs.readFileSync(file, "utf-8"))
  } catch {
    return []
  }
}

function getPageUrl(prefecture: string, industry: string) {
  return absoluteUrl(
    `/subsidies/prefecture/${encodeURIComponent(prefecture)}/industry/${encodeURIComponent(industry)}/`
  )
}

function getMatches(subsidies: SubsidyIndexItem[], prefecture: string, industry: string) {
  return subsidies.filter(
    (s) => matchesPrefecture(s, prefecture) && s.industries.includes(industry)
  )
}

export function generateStaticParams(): { prefecture: string; industry: string }[] {
  const subsidies = getSubsidies()
  const params: { prefecture: string; industry: string }[] = []

  for (const prefecture of POPULAR_PREFECTURES) {
    for (const industry of POPULAR_INDUSTRIES) {
      if (getMatches(subsidies, prefecture, industry).length > 0) {
        params.push({
          prefecture,
          industry,
        })
      }
    }
  }

  return params
}

function isValidCombo(prefecture: string, industry: string) {
  return isPrefecture(prefecture) && POPULAR_INDUSTRIES.includes(industry)
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { prefecture: rawPrefecture, industry: rawIndustry } = await params
  const prefecture = decode(rawPrefecture)
  const industry = decode(rawIndustry)

  if (!isValidCombo(prefecture, industry)) {
    return { title: `補助金一覧 | ${SITE_NAME}`, robots: { index: false, follow: false } }
  }

  const subsidies = getSubsidies()
  const matches = getMatches(subsidies, prefecture, industry)
  const active = matches.filter((s) => s.status !== "closed")
  const title = `${prefecture}の${industry}向け補助金一覧`
  const description = `${prefecture}で${industry}が対象の補助金を${active.length}件掲載。受付状況・用途・補助上限額で比較できます。`
  const pageUrl = getPageUrl(prefecture, industry)

  return {
    title,
    description,
    // 全国制度を含むため、地域固有の制度が少ない組み合わせは他ページと重複 → noindex
    robots: indexRobots(active.filter((s) => isLocalTo(s, prefecture)).length),
    alternates: { canonical: pageUrl },
    openGraph: { title, description, url: pageUrl, type: "website" },
    twitter: { card: "summary_large_image", title, description },
  }
}

export default async function Page({ params }: Props) {
  const { prefecture: rawPrefecture, industry: rawIndustry } = await params
  const prefecture = decode(rawPrefecture)
  const industry = decode(rawIndustry)

  if (!isValidCombo(prefecture, industry)) notFound()

  const subsidies = getSubsidies()
  const matches = getMatches(subsidies, prefecture, industry)
  const active = matches.filter((s) => s.status !== "closed")
  const latest = active
    .toSorted((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, 5)

  if (matches.length === 0) notFound()

  const faqItems = buildCollectionFaqItems(
    `${prefecture}の${industry}`,
    matches.length,
    active.filter((s) => s.status === "open").length
  )

  const title = `${prefecture}の${industry}向け補助金一覧`
  const description = `${prefecture}で${industry}が対象の補助金を${active.length}件掲載。受付状況・用途・補助上限額で比較できます。`
  const pageUrl = getPageUrl(prefecture, industry)

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: title,
    url: pageUrl,
    inLanguage: "ja",
    description,
    numberOfItems: active.length,
    mainEntity: latest.map((s, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: absoluteUrl(`/subsidies/${s.slug}/`),
      name: s.title,
    })),
  }

  const breadcrumbList = buildBreadcrumbList([
    { name: "ホーム", url: absoluteUrl("/") },
    { name: "補助金一覧", url: absoluteUrl("/subsidies/") },
    { name: `${prefecture}の補助金`, url: absoluteUrl(`/subsidies/prefecture/${encodeURIComponent(prefecture)}/`) },
    { name: title, url: pageUrl },
  ])

  return (
    <div className="page-content">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbList) }}
      />
      {faqItems.length > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(buildFaqStructuredData(faqItems)) }}
        />
      )}
      <Breadcrumb
        items={[
          { label: "ホーム", href: "/" },
          { label: "補助金一覧", href: "/subsidies" },
          { label: `${prefecture}の補助金`, href: `/subsidies/prefecture/${encodeURIComponent(prefecture)}` },
          { label: title },
        ]}
      />
      <div style={{ marginBottom: "1.5rem" }}>
        <p style={{ color: "#38b48b", fontSize: ".82rem", fontWeight: "bold", marginBottom: ".45rem" }}>
          都道府県×業種別の補助金
        </p>
        <h1 style={{ color: "var(--text-strong)", fontSize: "1.55rem", marginBottom: ".55rem" }}>
          {title}
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: ".9rem", lineHeight: 1.8 }}>
          {description}
        </p>
      </div>

      {latest.length > 0 && (
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
            {prefecture}の{industry}向け新着補助金
          </h2>
          <div style={{ display: "grid", gap: ".65rem" }}>
            {latest.map((s) => (
              <a
                key={s.id}
                href={`/subsidies/${s.slug}/`}
                style={{
                  color: "var(--text-strong)",
                  textDecoration: "none",
                  borderBottom: "1px solid var(--border-soft)",
                  paddingBottom: ".65rem",
                }}
              >
                <span style={{ color: "#38b48b", fontSize: ".78rem", fontWeight: "bold" }}>
                  {s.status === "open" ? "受付中" : "公募前"}
                </span>
                <span style={{ display: "block", fontSize: ".92rem", marginTop: ".25rem" }}>
                  {s.title}
                </span>
              </a>
            ))}
          </div>
        </section>
      )}

      <FaqSection items={faqItems} />

      <Suspense fallback={null}>
        <SubsidiesListClient
          subsidies={matches}
          initialPrefecture={prefecture}
          showPrefectureFilter={false}
          availablePurposes={[...new Set(matches.flatMap((s) => s.purposes))].sort()}
        />
      </Suspense>
    </div>
  )
}
