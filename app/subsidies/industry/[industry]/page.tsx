import { Suspense } from "react"
import fs from "fs"
import path from "path"
import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { SITE_NAME, absoluteUrl } from "../../../../lib/site"
import type { SubsidyIndexItem } from "../../../../lib/types"
import { Breadcrumb } from "../../../../components/elements/breadcrumb"
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
    const file = path.join(process.cwd(), "data", "generated", "subsidies-index.json")
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
    industry: encodeURIComponent(industry),
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
    return { title: `補助金一覧 | ${SITE_NAME}`, robots: { index: false, follow: false } }
  }

  const filtered = subsidies.filter((s) => s.industries.includes(industry) && s.status !== "closed")
  const title = `${industry}向け補助金一覧`
  const description = `${industry}が対象の補助金を${filtered.length}件掲載。中小企業・個人事業主向けに、都道府県・受付状態・用途・補助上限額で比較できます。`
  const pageUrl = getPageUrl(industry)

  return {
    title,
    description,
    alternates: { canonical: pageUrl },
    openGraph: { title: `${title} | ${SITE_NAME}`, description, url: pageUrl, type: "website" },
    twitter: { card: "summary_large_image", title: `${title} | ${SITE_NAME}`, description },
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

  const title = `${industry}向け補助金一覧`
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
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "ホーム", item: absoluteUrl("/") },
        { "@type": "ListItem", position: 2, name: "補助金一覧", item: absoluteUrl("/subsidies/") },
        { "@type": "ListItem", position: 3, name: title, item: pageUrl },
      ],
    },
    mainEntity: latest.map((s, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: absoluteUrl(`/subsidies/${s.slug}/`),
      name: s.title,
    })),
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
          { label: "補助金一覧", href: "/subsidies" },
          { label: title },
        ]}
      />
      <div style={{ marginBottom: "1.5rem" }}>
        <p style={{ color: "#38b48b", fontSize: ".82rem", fontWeight: "bold", marginBottom: ".45rem" }}>
          業種別の補助金
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
            {industry}向けの新着補助金
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

      <Suspense fallback={null}>
        <SubsidiesListClient
          subsidies={filtered}
          availablePurposes={[...new Set(filtered.flatMap((s) => s.purposes))].sort()}
        />
      </Suspense>
    </div>
  )
}
