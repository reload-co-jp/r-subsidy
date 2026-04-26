import { Suspense } from "react"
import fs from "fs"
import path from "path"
import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { PREFECTURES, isPrefecture, matchesPrefecture } from "../../../../lib/prefectures"
import { SITE_NAME, absoluteUrl } from "../../../../lib/site"
import type { SubsidyIndexItem } from "../../../../lib/types"
import { Breadcrumb } from "../../../../components/elements/breadcrumb"
import SubsidiesListClient from "../../subsidies-list-client"

export const dynamicParams = false

type Props = { params: Promise<{ prefecture: string }> }

export function generateStaticParams(): { prefecture: string }[] {
  return PREFECTURES.map((prefecture) => ({ prefecture }))
}

function getSubsidies(): SubsidyIndexItem[] {
  try {
    const file = path.join(process.cwd(), "data", "generated", "subsidies-index.json")
    return JSON.parse(fs.readFileSync(file, "utf-8"))
  } catch {
    return []
  }
}

function normalizePrefecture(value: string) {
  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}

function getPrefecturePageUrl(prefecture: string) {
  return absoluteUrl(`/subsidies/prefecture/${encodeURIComponent(prefecture)}/`)
}

function getOpenPrefectureSubsidies(subsidies: SubsidyIndexItem[], prefecture: string) {
  return subsidies.filter(
    (subsidy) => subsidy.status === "open" && matchesPrefecture(subsidy, prefecture)
  )
}

function getPrefectureSubsidies(subsidies: SubsidyIndexItem[], prefecture: string) {
  return subsidies.filter(
    (subsidy) =>
      subsidy.region !== "national" &&
      !subsidy.prefectures.includes("全国") &&
      matchesPrefecture(subsidy, prefecture)
  )
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { prefecture: rawPrefecture } = await params
  const prefecture = normalizePrefecture(rawPrefecture)

  if (!isPrefecture(prefecture)) {
    return {
      title: `補助金一覧 | ${SITE_NAME}`,
      robots: {
        index: false,
        follow: false,
      },
    }
  }

  const subsidies = getSubsidies()
  const prefectureSubsidies = getPrefectureSubsidies(subsidies, prefecture)
  const openSubsidies = getOpenPrefectureSubsidies(prefectureSubsidies, prefecture)
  const title = `${prefecture}で受付中の補助金一覧`
  const description = `${prefecture}で利用できる受付中の補助金を${openSubsidies.length}件掲載。中小企業・個人事業主向けに、対象用途、業種、補助上限額を比較できます。`
  const pageUrl = getPrefecturePageUrl(prefecture)

  return {
    title,
    description,
    alternates: {
      canonical: pageUrl,
    },
    openGraph: {
      title: `${title} | ${SITE_NAME}`,
      description,
      url: pageUrl,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | ${SITE_NAME}`,
      description,
    },
  }
}

export default async function Page({ params }: Props) {
  const { prefecture: rawPrefecture } = await params
  const prefecture = normalizePrefecture(rawPrefecture)

  if (!isPrefecture(prefecture)) {
    notFound()
  }

  const subsidies = getSubsidies()
  const prefectureSubsidies = getPrefectureSubsidies(subsidies, prefecture)
  const openSubsidies = getOpenPrefectureSubsidies(prefectureSubsidies, prefecture)
  const latestSubsidies = openSubsidies
    .toSorted((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, 5)
  const title = `${prefecture}で受付中の補助金一覧`
  const description = `${prefecture}で利用できる受付中の補助金を、対象用途・業種・補助上限額で比較できます。`
  const pageUrl = getPrefecturePageUrl(prefecture)
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: title,
    url: pageUrl,
    inLanguage: "ja",
    description,
    numberOfItems: openSubsidies.length,
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "ホーム",
          item: absoluteUrl("/"),
        },
        {
          "@type": "ListItem",
          position: 2,
          name: "補助金一覧",
          item: absoluteUrl("/subsidies/"),
        },
        {
          "@type": "ListItem",
          position: 3,
          name: title,
          item: pageUrl,
        },
      ],
    },
    mainEntity: latestSubsidies.map((subsidy, index) => ({
      "@type": "ListItem",
      position: index + 1,
      url: absoluteUrl(`/subsidies/${subsidy.slug}/`),
      name: subsidy.title,
    })),
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
          { label: title },
        ]}
      />
      <div style={{ marginBottom: "1.5rem" }}>
        <p style={{ color: "#38b48b", fontSize: ".82rem", fontWeight: "bold", marginBottom: ".45rem" }}>
          都道府県別の補助金
        </p>
        <h1 style={{ color: "var(--text-strong)", fontSize: "1.55rem", marginBottom: ".55rem" }}>
          {title}
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: ".9rem", lineHeight: 1.8 }}>
          {openSubsidies.length}件の受付中の補助金を掲載しています。{prefecture}
          を対象とした制度をまとめています。
        </p>
      </div>

      {latestSubsidies.length > 0 && (
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
            {prefecture}で確認したい新着補助金
          </h2>
          <div style={{ display: "grid", gap: ".65rem" }}>
            {latestSubsidies.map((subsidy) => (
              <a
                key={subsidy.id}
                href={`/subsidies/${subsidy.slug}/`}
                style={{
                  color: "var(--text-strong)",
                  textDecoration: "none",
                  borderBottom: "1px solid var(--border-soft)",
                  paddingBottom: ".65rem",
                }}
              >
                <span style={{ color: "#38b48b", fontSize: ".78rem", fontWeight: "bold" }}>
                  受付中
                </span>
                <span style={{ display: "block", fontSize: ".92rem", marginTop: ".25rem" }}>
                  {subsidy.title}
                </span>
              </a>
            ))}
          </div>
        </section>
      )}

      <Suspense fallback={null}>
        <SubsidiesListClient
          subsidies={prefectureSubsidies}
          initialPrefecture={prefecture}
          showPrefectureFilter={false}
        />
      </Suspense>
    </div>
  )
}
