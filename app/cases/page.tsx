import { FC, Suspense } from "react"
import fs from "fs"
import path from "path"
import type { Metadata } from "next"
import Link from "next/link"
import { SITE_NAME, absoluteUrl } from "../../lib/site"
import { Breadcrumb } from "../../components/elements/breadcrumb"
import CasesListClient from "./cases-list-client"

type ApplicationCase = {
  id: string
  subsidyName: string
  industry: string
  companyType: string
  region: string
  challenge: string
  solution: string
  result: string
  sourceLabel: string
  sourceUrl: string
}

function getCases(): ApplicationCase[] {
  try {
    const file = path.join(process.cwd(), "data", "source", "application-cases.json")
    return JSON.parse(fs.readFileSync(file, "utf-8"))
  } catch {
    return []
  }
}

const PAGE_TITLE = "補助金 申請事例"
const PAGE_DESCRIPTION =
  "IT導入補助金・ものづくり補助金・小規模事業者持続化補助金などの実際の申請・採択事例を業種別に紹介。課題・取り組み内容・効果をまとめています。"
const PAGE_URL = absoluteUrl("/cases/")

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  alternates: { canonical: PAGE_URL },
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
  const cases = getCases()

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: PAGE_TITLE,
    url: PAGE_URL,
    inLanguage: "ja",
    description: PAGE_DESCRIPTION,
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "ホーム", item: absoluteUrl("/") },
        { "@type": "ListItem", position: 2, name: PAGE_TITLE, item: PAGE_URL },
      ],
    },
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
          { label: "申請事例" },
        ]}
      />

      <div style={{ marginBottom: "1.75rem" }}>
        <h1
          style={{
            color: "var(--text-strong)",
            fontSize: "1.4rem",
            marginBottom: ".5rem",
          }}
        >
          補助金 申請事例
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: ".875rem", lineHeight: 1.8 }}>
          実際に補助金を活用した中小企業・小規模事業者の事例を紹介します。
          課題・取り組み内容・得られた効果を業種別にまとめています。
        </p>
      </div>

      <Suspense fallback={null}>
        <CasesListClient
          cases={cases}
          subsidyNames={[...new Set(cases.map((c) => c.subsidyName))].sort()}
        />
      </Suspense>

      <div
        style={{
          marginTop: "2.5rem",
          padding: "1.5rem",
          backgroundColor: "var(--bg-surface)",
          border: "1px solid var(--border-soft)",
          borderRadius: "10px",
          textAlign: "center",
        }}
      >
        <p style={{ color: "var(--text-base)", fontSize: ".9rem", marginBottom: "1rem" }}>
          自社に合う補助金を探してみましょう
        </p>
        <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
          <Link
            href="/diagnosis"
            style={{
              display: "inline-block",
              backgroundColor: "#38b48b",
              color: "#fff",
              padding: ".65rem 1.75rem",
              borderRadius: "8px",
              textDecoration: "none",
              fontWeight: "bold",
              fontSize: ".9rem",
            }}
          >
            補助金診断をする →
          </Link>
          <Link
            href="/subsidies"
            style={{
              display: "inline-block",
              backgroundColor: "var(--bg-surface-alt)",
              color: "var(--text-base)",
              border: "1px solid var(--border-soft)",
              padding: ".65rem 1.75rem",
              borderRadius: "8px",
              textDecoration: "none",
              fontSize: ".9rem",
            }}
          >
            補助金一覧を見る
          </Link>
        </div>
      </div>
    </div>
  )
}

export default Page
