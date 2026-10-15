import SubsidyLinkList from "../../../../components/elements/subsidy-link-list"
import { Suspense } from "react"
import fs from "fs"
import path from "path"
import type { Metadata } from "next"
import { notFound } from "next/navigation"
import {
  SITE_NAME,
  absoluteUrl,
  buildBreadcrumbList,
} from "../../../../lib/site"
import { YEAR_LABEL, CURRENT_YEAR, indexRobots } from "../../../../lib/seo"
import {
  POPULAR_PREFECTURES,
  matchesPrefecture,
} from "../../../../lib/prefectures"
import { POPULAR_INDUSTRIES } from "../../../../lib/industries"
import type { SubsidyIndexItem } from "../../../../lib/types"
import { Breadcrumb } from "../../../../components/elements/breadcrumb"
import FaqSection, {
  buildFaqStructuredData,
} from "../../../../components/elements/faq-section"
import { buildCollectionFaqItems } from "../../../../lib/collection-faq"
import SubsidiesListClient from "../../subsidies-list-client"

export const dynamicParams = false

type Props = { params: Promise<{ industry: string }> }

function decode(value: string) {
  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}

function getSubsidies(): SubsidyIndexItem[] {
  try {
    const file = path.join(
      process.cwd(),
      "data",
      "generated",
      "subsidies-index.json"
    )
    return JSON.parse(fs.readFileSync(file, "utf-8"))
  } catch {
    return []
  }
}

function getAllIndustries(subsidies: SubsidyIndexItem[]): string[] {
  const set = new Set<string>()
  subsidies.forEach((s) => s.industries.forEach((i) => set.add(i)))
  return [...set].sort()
}

export function generateStaticParams(): { industry: string }[] {
  const subsidies = getSubsidies()
  return getAllIndustries(subsidies).map((industry) => ({
    industry,
  }))
}

function getPageUrl(industry: string) {
  return absoluteUrl(`/subsidies/industry/${encodeURIComponent(industry)}/`)
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { industry: raw } = await params
  const industry = decode(raw)
  const subsidies = getSubsidies()
  const all = getAllIndustries(subsidies)

  if (!all.includes(industry)) {
    return {
      title: `補助金一覧 | ${SITE_NAME}`,
      robots: { index: false, follow: false },
    }
  }

  const filtered = subsidies.filter(
    (s) => s.industries.includes(industry) && s.status !== "closed"
  )
  const title = `${industry}向けの補助金・助成金一覧｜${CURRENT_YEAR}年最新`
  const description = `${industry}が対象の補助金を${filtered.length}件掲載。中小企業・個人事業主向けに、都道府県・受付状態・用途・補助上限額で比較できます。`
  const pageUrl = getPageUrl(industry)

  return {
    title,
    description,
    robots: indexRobots(filtered.length),
    alternates: { canonical: pageUrl },
    openGraph: { title, description, url: pageUrl, type: "website" },
    twitter: { card: "summary_large_image", title, description },
  }
}

export default async function Page({ params }: Props) {
  const { industry: raw } = await params
  const industry = decode(raw)
  const subsidies = getSubsidies()
  const all = getAllIndustries(subsidies)

  if (!all.includes(industry)) notFound()

  const filtered = subsidies.filter((s) => s.industries.includes(industry))
  const active = filtered.filter((s) => s.status !== "closed")
  const latest = active
    .toSorted((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, 5)
  const comboPrefectures = POPULAR_INDUSTRIES.includes(industry)
    ? POPULAR_PREFECTURES.filter((prefecture) =>
        filtered.some((s) => matchesPrefecture(s, prefecture))
      )
    : []
  const faqItems = buildCollectionFaqItems(
    industry,
    filtered.length,
    active.filter((s) => s.status === "open").length
  )

  const title = `${industry}向けの補助金・助成金一覧｜${CURRENT_YEAR}年最新`
  const description = `${industry}が対象の補助金を${active.length}件掲載。中小企業・個人事業主向けに、都道府県・受付状態・用途・補助上限額で比較できます。`
  const pageUrl = getPageUrl(industry)

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
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(buildFaqStructuredData(faqItems)),
          }}
        />
      )}
      <Breadcrumb
        items={[
          { label: "ホーム", href: "/" },
          { label: "補助金一覧", href: "/subsidies" },
          { label: title },
        ]}
      />
      <div style={{ marginBottom: "1.5rem" }}>
        <p className="eyebrow">業種別の補助金</p>
        <h1 className="page-title">
          {YEAR_LABEL}の{industry}向け補助金・助成金
        </h1>
        <p className="page-lead">{description}</p>
      </div>

      {latest.length > 0 && (
        <section style={{ marginBottom: "2rem" }}>
          <h2 className="sub-title">{industry}向けの新着補助金</h2>
          <SubsidyLinkList items={latest} />
        </section>
      )}

      {comboPrefectures.length > 0 && (
        <section style={{ marginBottom: "1.5rem" }}>
          <h2 className="sub-title">{industry}の都道府県別補助金</h2>
          <div className="chip-group">
            {comboPrefectures.map((prefecture) => (
              <a
                key={prefecture}
                href={`/subsidies/prefecture/${encodeURIComponent(prefecture)}/industry/${encodeURIComponent(industry)}/`}
                className="chip"
              >
                {prefecture}
              </a>
            ))}
          </div>
        </section>
      )}

      <FaqSection items={faqItems} />

      <Suspense fallback={null}>
        <SubsidiesListClient
          subsidies={filtered}
          availablePurposes={[
            ...new Set(filtered.flatMap((s) => s.purposes)),
          ].sort()}
        />
      </Suspense>
    </div>
  )
}
