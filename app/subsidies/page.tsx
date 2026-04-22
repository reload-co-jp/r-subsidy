import { FC } from "react"
import { Suspense } from "react"
import fs from "fs"
import path from "path"
import type { Metadata } from "next"
import type { SubsidyIndexItem } from "../../lib/types"
import { SITE_NAME, absoluteUrl } from "../../lib/site"
import SubsidiesListClient from "./subsidies-list-client"

function getSubsidies(): SubsidyIndexItem[] {
  try {
    const file = path.join(process.cwd(), "data", "generated", "subsidies-index.json")
    return JSON.parse(fs.readFileSync(file, "utf-8"))
  } catch {
    return []
  }
}

export const metadata: Metadata = {
  title: `補助金一覧 | ${SITE_NAME}`,
  description:
    "国と東京都の補助金一覧を掲載しています。対象地域、用途、補助上限額などを確認しながら制度を比較できます。",
  alternates: {
    canonical: absoluteUrl("/subsidies/"),
  },
}

const Page: FC = () => {
  const subsidies = getSubsidies()
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "補助金一覧",
    url: absoluteUrl("/subsidies/"),
    inLanguage: "ja",
    description:
      "国と東京都の補助金一覧を掲載しています。対象地域、用途、補助上限額などを確認しながら制度を比較できます。",
    numberOfItems: subsidies.length,
  }

  return (
    <div style={{ maxWidth: "900px", margin: "0 auto" }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <div style={{ marginBottom: "1.5rem" }}>
        <h1 style={{ color: "var(--text-strong)", fontSize: "1.4rem", marginBottom: ".5rem" }}>
          補助金一覧
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: ".875rem" }}>
          {subsidies.length > 0 ? `${subsidies.length}件の補助金` : "データが未取得です。pnpm subsidies:update を実行してください。"}
        </p>
      </div>

      <section style={{ marginBottom: "1.5rem", color: "var(--text-base)", fontSize: ".92rem", lineHeight: 1.8 }}>
        <p style={{ marginBottom: ".7rem" }}>
          中小企業・個人事業主向けの補助金を一覧で確認できるページです。設備投資、デジタル化、人材育成、販路拡大など、
          目的別に制度の概要を比較できます。
        </p>
        <p>
          気になる制度は詳細ページで対象条件や補助率、上限額、申請窓口を確認できます。
        </p>
      </section>

      <Suspense fallback={null}>
        <SubsidiesListClient subsidies={subsidies} />
      </Suspense>
    </div>
  )
}

export default Page
