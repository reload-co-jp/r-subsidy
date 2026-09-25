import { Suspense } from "react"
import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { PREFECTURES } from "../../../../../../lib/prefectures"
import { absoluteUrl, buildBreadcrumbList } from "../../../../../../lib/site"
import {
  CURRENT_YEAR,
  MIN_INDEX_COUNT,
  YEAR_LABEL,
  getPrefecturePurposes,
  isActive,
  isLocalTo,
  loadSubsidyIndex,
  purposeLabel,
} from "../../../../../../lib/seo"
import { Breadcrumb } from "../../../../../../components/elements/breadcrumb"
import FaqSection, { buildFaqStructuredData } from "../../../../../../components/elements/faq-section"
import { buildCollectionFaqItems } from "../../../../../../lib/collection-faq"
import SubsidiesListClient from "../../../../subsidies-list-client"

export const dynamicParams = false

type Props = { params: Promise<{ prefecture: string; purpose: string }> }

function decode(value: string) {
  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}

// 地域固有の制度が十分にある組み合わせのみ生成（薄いページを作らない）
// ネストした動的セグメントは生値で返す（エンコードすると二重エンコードされ404になる）
export function generateStaticParams() {
  const subsidies = loadSubsidyIndex()
  return PREFECTURES.flatMap((prefecture) =>
    getPrefecturePurposes(subsidies, prefecture)
      .filter(({ count }) => count >= MIN_INDEX_COUNT)
      .map(({ purpose }) => ({
        prefecture,
        purpose,
      }))
  )
}

function getPageData(rawPrefecture: string, rawPurpose: string) {
  const prefecture = decode(rawPrefecture)
  const purpose = decode(rawPurpose)
  const matches = loadSubsidyIndex().filter((s) => isLocalTo(s, prefecture) && s.purposes.includes(purpose))
  const active = matches.filter(isActive)
  const label = purposeLabel(purpose)
  const openCount = active.filter((s) => s.status === "open").length
  return {
    prefecture,
    purpose,
    label,
    matches,
    active,
    openCount,
    title: `${prefecture}の${label}補助金・助成金｜${CURRENT_YEAR}年最新`,
    description: `${prefecture}で${label}に使える地域独自の補助金・助成金を掲載。受付中${openCount}件、公募予定${active.length - openCount}件を補助上限額・受付期間で比較できます。`,
    pageUrl: absoluteUrl(
      `/subsidies/prefecture/${encodeURIComponent(prefecture)}/purpose/${encodeURIComponent(purpose)}/`
    ),
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { prefecture, purpose } = await params
  const { title, description, pageUrl } = getPageData(prefecture, purpose)
  return {
    title,
    description,
    alternates: { canonical: pageUrl },
    openGraph: { title, description, url: pageUrl, type: "website" },
    twitter: { card: "summary_large_image", title, description },
  }
}

export default async function Page({ params }: Props) {
  const { prefecture: rawPrefecture, purpose: rawPurpose } = await params
  const { prefecture, purpose, label, matches, active, openCount, title, description, pageUrl } = getPageData(
    rawPrefecture,
    rawPurpose
  )
  if (active.length === 0) notFound()

  const prefectureHref = `/subsidies/prefecture/${encodeURIComponent(prefecture)}/`
  const purposeHref = `/subsidies/purpose/${encodeURIComponent(purpose)}/`
  const faqItems = buildCollectionFaqItems(`${prefecture}の${label}`, matches.length, openCount)
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: title,
    url: pageUrl,
    inLanguage: "ja",
    description,
    numberOfItems: active.length,
    mainEntity: active.slice(0, 10).map((s, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: absoluteUrl(`/subsidies/${s.slug}/`),
      name: s.title,
    })),
  }
  const breadcrumbList = buildBreadcrumbList([
    { name: "ホーム", url: absoluteUrl("/") },
    { name: "補助金一覧", url: absoluteUrl("/subsidies/") },
    { name: `${prefecture}の補助金`, url: absoluteUrl(prefectureHref) },
    { name: `${prefecture}の${label}補助金`, url: pageUrl },
  ])

  return (
    <div className="page-content">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbList) }} />
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
          { label: `${prefecture}の補助金`, href: prefectureHref },
          { label: `${prefecture}の${label}補助金` },
        ]}
      />
      <div style={{ marginBottom: "1.5rem" }}>
        <p style={{ color: "#38b48b", fontSize: ".82rem", fontWeight: "bold", marginBottom: ".45rem" }}>
          都道府県×目的別の補助金
        </p>
        <h1 style={{ color: "var(--text-strong)", fontSize: "1.55rem", marginBottom: ".55rem" }}>
          {YEAR_LABEL}の{prefecture}の{label}補助金・助成金
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: ".9rem", lineHeight: 1.8 }}>
          {prefecture}や域内の市区町村が実施する、{label}に使える補助金・助成金をまとめています。現在受付中は
          {openCount}件、公募予定は{active.length - openCount}件です。国の制度も含めて探す場合は
          <a href={purposeHref} style={{ color: "#38b48b" }}>
            {label}に使える補助金一覧
          </a>
          、{prefecture}の他の目的は
          <a href={prefectureHref} style={{ color: "#38b48b" }}>
            {prefecture}の補助金一覧
          </a>
          をご覧ください。
        </p>
      </div>

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
