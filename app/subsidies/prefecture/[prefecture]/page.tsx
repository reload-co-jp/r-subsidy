import { Suspense } from "react"
import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { PREFECTURES, POPULAR_PREFECTURES, isPrefecture, matchesPrefecture } from "../../../../lib/prefectures"
import { POPULAR_INDUSTRIES } from "../../../../lib/industries"
import { SITE_NAME, absoluteUrl, buildBreadcrumbList } from "../../../../lib/site"
import type { SubsidyIndexItem } from "../../../../lib/types"
import { Breadcrumb } from "../../../../components/elements/breadcrumb"
import FaqSection, { buildFaqStructuredData } from "../../../../components/elements/faq-section"
import { buildCollectionFaqItems } from "../../../../lib/collection-faq"
import SubsidiesListClient from "../../subsidies-list-client"
import { YEAR_LABEL, CURRENT_YEAR, getPrefecturePurposes, indexRobots, MIN_INDEX_COUNT, loadSubsidyIndex, purposeLabel } from "../../../../lib/seo"

export const dynamicParams = false

type Props = { params: Promise<{ prefecture: string }> }

export function generateStaticParams(): { prefecture: string }[] {
  return PREFECTURES.map((prefecture) => ({ prefecture }))
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

function buildCopy(prefecture: string, openCount: number) {
  return {
    title: `${prefecture}の補助金・助成金一覧｜${CURRENT_YEAR}年最新`,
    description: `${prefecture}で利用できる補助金・助成金を、目的・業種・受付状況などから検索できます。現在受付中は${openCount}件。`,
  }
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

  const subsidies = loadSubsidyIndex()
  const prefectureSubsidies = getPrefectureSubsidies(subsidies, prefecture)
  const openSubsidies = getOpenPrefectureSubsidies(prefectureSubsidies, prefecture)
  const { title, description } = buildCopy(prefecture, openSubsidies.length)
  const pageUrl = getPrefecturePageUrl(prefecture)

  return {
    title,
    description,
    robots: indexRobots(prefectureSubsidies.length),
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

  const subsidies = loadSubsidyIndex()
  const prefectureSubsidies = getPrefectureSubsidies(subsidies, prefecture)
  const openSubsidies = getOpenPrefectureSubsidies(prefectureSubsidies, prefecture)
  const latestSubsidies = openSubsidies
    .toSorted((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, 5)
  // 都道府県×業種ページは主要都道府県のみ生成しているため、それ以外はリンクしない
  const comboIndustries = POPULAR_PREFECTURES.includes(prefecture)
    ? POPULAR_INDUSTRIES.filter((industry) =>
        prefectureSubsidies.some((s) => s.industries.includes(industry))
      )
    : []
  const faqItems = buildCollectionFaqItems(prefecture, prefectureSubsidies.length, openSubsidies.length)
  const upcomingCount = prefectureSubsidies.filter((s) => s.status === "upcoming").length
  const purposeLinks = getPrefecturePurposes(subsidies, prefecture)
  const { title, description } = buildCopy(prefecture, openSubsidies.length)
  const pageUrl = getPrefecturePageUrl(prefecture)
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: title,
    url: pageUrl,
    inLanguage: "ja",
    description,
    numberOfItems: openSubsidies.length,
    mainEntity: latestSubsidies.map((subsidy, index) => ({
      "@type": "ListItem",
      position: index + 1,
      url: absoluteUrl(`/subsidies/${subsidy.slug}/`),
      name: subsidy.title,
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
          dangerouslySetInnerHTML={{ __html: JSON.stringify(buildFaqStructuredData(faqItems)) }}
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
        <p style={{ color: "#38b48b", fontSize: ".82rem", fontWeight: "bold", marginBottom: ".45rem" }}>
          都道府県別の補助金
        </p>
        <h1 style={{ color: "var(--text-strong)", fontSize: "1.55rem", marginBottom: ".55rem" }}>
          {YEAR_LABEL}の{prefecture}の補助金・助成金
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: ".9rem", lineHeight: 1.8 }}>
          {YEAR_LABEL}の{prefecture}の補助金・助成金をまとめています。{prefecture}
          や域内の市区町村が実施する地域独自の制度を対象に、現在受付中が{openSubsidies.length}件、公募予定が
          {upcomingCount}件あります。国の制度（全国対象）は
          <a href="/subsidies/" style={{ color: "#38b48b" }}>全国の補助金一覧</a>
          で確認できます。申請の流れは
          <a href="/guides/" style={{ color: "#38b48b" }}>申請ガイド</a>
          を参照してください。
        </p>
      </div>

      {purposeLinks.length > 0 && (
        <section style={{ marginBottom: "1.5rem" }}>
          <h2 style={{ color: "var(--text-strong)", fontSize: ".95rem", marginBottom: ".6rem" }}>
            {prefecture}の目的別補助金
          </h2>
          <div style={{ display: "flex", flexWrap: "wrap", gap: ".5rem" }}>
            {purposeLinks.map(({ purpose, count }) => (
              <a
                key={purpose}
                href={
                  count >= MIN_INDEX_COUNT
                    ? `/subsidies/prefecture/${encodeURIComponent(prefecture)}/purpose/${encodeURIComponent(purpose)}/`
                    : `/subsidies/purpose/${encodeURIComponent(purpose)}/`
                }
                style={{
                  fontSize: ".82rem",
                  color: "var(--text-strong)",
                  border: "1px solid var(--border-soft)",
                  borderRadius: "999px",
                  padding: ".35rem .8rem",
                  textDecoration: "none",
                }}
              >
                {count >= MIN_INDEX_COUNT ? `${purposeLabel(purpose)}（${count}）` : purposeLabel(purpose)}
              </a>
            ))}
          </div>
        </section>
      )}

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
            {prefecture}で現在受付中の補助金
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

      {comboIndustries.length > 0 && (
        <section style={{ marginBottom: "1.5rem" }}>
          <h2 style={{ color: "var(--text-strong)", fontSize: ".95rem", marginBottom: ".6rem" }}>
            {prefecture}の業種別補助金
          </h2>
          <div style={{ display: "flex", flexWrap: "wrap", gap: ".5rem" }}>
            {comboIndustries.map((industry) => (
              <a
                key={industry}
                href={`/subsidies/prefecture/${encodeURIComponent(prefecture)}/industry/${encodeURIComponent(industry)}/`}
                style={{
                  fontSize: ".82rem",
                  color: "var(--text-strong)",
                  border: "1px solid var(--border-soft)",
                  borderRadius: "999px",
                  padding: ".35rem .8rem",
                  textDecoration: "none",
                }}
              >
                {industry}
              </a>
            ))}
          </div>
        </section>
      )}

      <FaqSection items={faqItems} />

      <Suspense fallback={null}>
        <SubsidiesListClient
          subsidies={prefectureSubsidies}
          initialPrefecture={prefecture}
          showPrefectureFilter={false}
          availablePurposes={[...new Set(prefectureSubsidies.flatMap((s) => s.purposes))].sort()}
        />
      </Suspense>
    </div>
  )
}
