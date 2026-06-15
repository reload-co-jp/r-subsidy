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

type Props = { params: Promise<{ purpose: string }> }

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

function getAllPurposes(subsidies: SubsidyIndexItem[]): string[] {
  const set = new Set<string>()
  subsidies.forEach((s) => s.purposes.forEach((p) => set.add(p)))
  return [...set].sort()
}

export function generateStaticParams(): { purpose: string }[] {
  const subsidies = getSubsidies()
  return getAllPurposes(subsidies).map((purpose) => ({ purpose: encodeURIComponent(purpose) }))
}

function getPageUrl(purpose: string) {
  return absoluteUrl(`/subsidies/purpose/${encodeURIComponent(purpose)}/`)
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { purpose: raw } = await params
  const purpose = decode(raw)
  const subsidies = getSubsidies()
  const all = getAllPurposes(subsidies)

  if (!all.includes(purpose)) {
    return { title: `補助金一覧 | ${SITE_NAME}`, robots: { index: false, follow: false } }
  }

  const filtered = subsidies.filter((s) => s.purposes.includes(purpose) && s.status !== "closed")
  const title = `${purpose}に使える補助金一覧`
  const description = `${purpose}目的で利用できる補助金を${filtered.length}件掲載。中小企業・個人事業主向けに、都道府県・受付状態・補助上限額で絞り込み比較できます。`
  const pageUrl = getPageUrl(purpose)

  return {
    title,
    description,
    alternates: { canonical: pageUrl },
    openGraph: { title: `${title} | ${SITE_NAME}`, description, url: pageUrl, type: "website" },
    twitter: { card: "summary_large_image", title: `${title} | ${SITE_NAME}`, description },
  }
}

export default async function Page({ params }: Props) {
  const { purpose: raw } = await params
  const purpose = decode(raw)
  const subsidies = getSubsidies()
  const all = getAllPurposes(subsidies)

  if (!all.includes(purpose)) notFound()

  const filtered = subsidies.filter((s) => s.purposes.includes(purpose))
  const active = filtered.filter((s) => s.status !== "closed")
  const latest = active
    .toSorted((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, 5)

  const title = `${purpose}に使える補助金一覧`
  const description = `${purpose}目的で利用できる補助金を${active.length}件掲載。中小企業・個人事業主向けに、都道府県・受付状態・補助上限額で絞り込み比較できます。`
  const pageUrl = getPageUrl(purpose)

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
          目的別の補助金
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
            {purpose}の新着補助金
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
          availablePurposes={all}
        />
      </Suspense>
    </div>
  )
}
