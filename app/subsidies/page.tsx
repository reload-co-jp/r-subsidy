import { FC } from "react"
import { Suspense } from "react"
import fs from "fs"
import path from "path"
import type { Metadata } from "next"
import Link from "next/link"
import { PREFECTURES } from "../../lib/prefectures"
import type { SubsidyIndexItem } from "../../lib/types"
import { SITE_NAME, absoluteUrl, buildBreadcrumbList } from "../../lib/site"
import { Breadcrumb } from "../../components/elements/breadcrumb"
import SubsidiesListClient from "./subsidies-list-client"
import { CURRENT_YEAR } from "../../lib/seo"

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

const ALL_SUBSIDIES = getSubsidies()
const OPEN_COUNT = ALL_SUBSIDIES.filter((s) => s.status === "open").length
const PAGE_TITLE = `全国の補助金・助成金一覧｜${CURRENT_YEAR}年最新`
const PAGE_DESCRIPTION = `現在受付中の補助金・助成金${OPEN_COUNT}件を含む${ALL_SUBSIDIES.length.toLocaleString()}件を一覧掲載。都道府県・業種・用途・補助上限額で絞り込み、中小企業・個人事業主が使える制度をすぐに比較できます。`
const PAGE_URL = absoluteUrl("/subsidies/")

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  alternates: {
    canonical: PAGE_URL,
  },
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
  const subsidies = ALL_SUBSIDIES
  const structuredData = [
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: "補助金一覧",
      url: PAGE_URL,
      inLanguage: "ja",
      description: PAGE_DESCRIPTION,
      numberOfItems: subsidies.length,
    },
  ]

  const breadcrumbList = buildBreadcrumbList([
    { name: "ホーム", url: absoluteUrl("/") },
    { name: "補助金一覧", url: PAGE_URL },
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
      <Breadcrumb
        items={[{ label: "ホーム", href: "/" }, { label: "補助金一覧" }]}
      />
      <div style={{ marginBottom: "1.5rem" }}>
        <h1 className="page-title">全国の補助金・助成金一覧</h1>
        <p className="page-lead">
          中小企業・個人事業主向けの補助金・助成金
          {subsidies.length.toLocaleString()}
          件を掲載しています。キーワード・地域・目的・業種・受付状態で絞り込み、締切や補助上限額で並べ替えて比較できます。気になる制度は詳細ページで対象条件・補助率・申請窓口を確認してください。
        </p>
        <ul className="list-plain chip-group" style={{ marginTop: ".85rem" }}>
          <li>
            <Link href="/subsidies/open/" className="chip">
              受付中の補助金
            </Link>
          </li>
          <li>
            <Link href="/subsidies/deadline/" className="chip">
              締切が近い補助金
            </Link>
          </li>
          <li>
            <Link href="/subsidies/upcoming/" className="chip">
              公募予定の補助金
            </Link>
          </li>
        </ul>
      </div>

      <section className="card" style={{ marginBottom: "1.5rem" }}>
        <h2 className="sub-title">都道府県別の補助金一覧</h2>
        <div className="chip-group">
          {PREFECTURES.map((prefecture) => (
            <Link
              key={prefecture}
              href={`/subsidies/prefecture/${encodeURIComponent(prefecture)}`}
              className="chip"
            >
              {prefecture}
            </Link>
          ))}
        </div>
      </section>

      <Suspense fallback={null}>
        <SubsidiesListClient
          subsidies={subsidies}
          availablePurposes={[
            ...new Set(subsidies.flatMap((s) => s.purposes)),
          ].sort()}
        />
      </Suspense>
    </div>
  )
}

export default Page
