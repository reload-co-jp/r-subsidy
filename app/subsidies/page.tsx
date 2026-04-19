import { FC } from "react"
import Link from "next/link"
import fs from "fs"
import path from "path"
import type { Metadata } from "next"
import type { SubsidyIndexItem } from "../../lib/types"
import { SITE_NAME, absoluteUrl } from "../../lib/site"

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

const statusLabel: Record<string, { label: string; color: string }> = {
  open: { label: "受付中", color: "#22c55e" },
  upcoming: { label: "公募前", color: "#f59e0b" },
  closed: { label: "終了", color: "#6b7280" },
  unknown: { label: "要確認", color: "#94a3b8" },
}

const regionLabel: Record<string, string> = {
  national: "全国",
  tokyo: "東京都",
  prefecture: "都道府県",
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
        <h1 style={{ color: "#e0e0ff", fontSize: "1.4rem", marginBottom: ".5rem" }}>
          補助金一覧
        </h1>
        <p style={{ color: "#888", fontSize: ".875rem" }}>
          {subsidies.length > 0 ? `${subsidies.length}件の補助金` : "データが未取得です。pnpm subsidies:update を実行してください。"}
        </p>
      </div>

      <section style={{ marginBottom: "1.5rem", color: "#aaa", fontSize: ".92rem", lineHeight: 1.8 }}>
        <p style={{ marginBottom: ".7rem" }}>
          中小企業・個人事業主向けの補助金を一覧で確認できるページです。設備投資、デジタル化、人材育成、販路拡大など、
          目的別に制度の概要を比較できます。
        </p>
        <p>
          気になる制度は詳細ページで対象条件や補助率、上限額、申請窓口を確認できます。
        </p>
      </section>

      {subsidies.length === 0 ? (
        <div
          style={{
            backgroundColor: "#1e2d4a",
            borderRadius: "8px",
            padding: "3rem",
            textAlign: "center",
            color: "#888",
          }}
        >
          <p style={{ marginBottom: "1rem" }}>補助金データがありません</p>
          <code
            style={{
              backgroundColor: "#0d1117",
              padding: ".5rem 1rem",
              borderRadius: "4px",
              fontSize: ".875rem",
              color: "#7ec8e3",
            }}
          >
            pnpm subsidies:update
          </code>
        </div>
      ) : (
        <div style={{ display: "grid", gap: ".75rem" }}>
          {subsidies.map((s) => {
            const st = statusLabel[s.status] ?? statusLabel.unknown
            return (
              <Link
                key={s.id}
                href={`/subsidies/${s.slug}`}
                style={{ textDecoration: "none" }}
              >
                <div
                  style={{
                    backgroundColor: "#1e2d4a",
                    borderRadius: "8px",
                    padding: "1.25rem",
                    border: "1px solid #2a3a5a",
                    transition: "border-color .15s",
                    cursor: "pointer",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: ".75rem",
                      flexWrap: "wrap",
                    }}
                  >
                    <span
                      style={{
                        backgroundColor: st.color + "22",
                        color: st.color,
                        border: `1px solid ${st.color}44`,
                        borderRadius: "4px",
                        padding: ".15rem .5rem",
                        fontSize: ".75rem",
                        whiteSpace: "nowrap",
                        flexShrink: 0,
                      }}
                    >
                      {st.label}
                    </span>
                    <span
                      style={{
                        backgroundColor: "#2a3a5a",
                        color: "#94a3b8",
                        borderRadius: "4px",
                        padding: ".15rem .5rem",
                        fontSize: ".75rem",
                        whiteSpace: "nowrap",
                        flexShrink: 0,
                      }}
                    >
                      {regionLabel[s.region] ?? s.region}
                    </span>
                    <h2
                      style={{
                        color: "#e0e0ff",
                        fontSize: ".95rem",
                        fontWeight: "bold",
                        margin: 0,
                        flex: 1,
                        minWidth: "200px",
                      }}
                    >
                      {s.title}
                    </h2>
                  </div>
                  <div
                    style={{
                      marginTop: ".75rem",
                      display: "flex",
                      gap: ".5rem",
                      flexWrap: "wrap",
                    }}
                  >
                    {s.purposes.slice(0, 4).map((p) => (
                      <span
                        key={p}
                        style={{
                          backgroundColor: "#1a1a3e",
                          color: "#7ec8e3",
                          borderRadius: "4px",
                          padding: ".1rem .4rem",
                          fontSize: ".75rem",
                        }}
                      >
                        {p}
                      </span>
                    ))}
                    {s.upperLimit && (
                      <span
                        style={{
                          marginLeft: "auto",
                          color: "#f59e0b",
                          fontSize: ".8rem",
                          whiteSpace: "nowrap",
                        }}
                      >
                        上限 {s.upperLimit}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default Page
