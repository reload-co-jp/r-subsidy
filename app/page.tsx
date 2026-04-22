import { FC } from "react"
import Link from "next/link"
import fs from "fs"
import path from "path"
import type { Metadata } from "next"
import type { NormalizedSubsidy, SubsidyIndexItem, UpdateHistory } from "../lib/types"
import { SITE_NAME, SITE_URL, absoluteUrl } from "../lib/site"

function getUpdateHistory(): UpdateHistory | null {
  try {
    const file = path.join(process.cwd(), "data", "generated", "update-history.json")
    return JSON.parse(fs.readFileSync(file, "utf-8"))
  } catch {
    return null
  }
}

function getLatestSubsidies(): NormalizedSubsidy[] {
  try {
    const file = path.join(process.cwd(), "data", "generated", "subsidies-master.json")
    const subsidies: NormalizedSubsidy[] = JSON.parse(fs.readFileSync(file, "utf-8"))

    return subsidies
      .filter((subsidy) => subsidy.status !== "closed")
      .sort((a, b) => getSortTime(b) - getSortTime(a))
      .slice(0, 5)
  } catch {
    return []
  }
}

function getSubsidyStats() {
  try {
    const file = path.join(process.cwd(), "data", "generated", "subsidies-index.json")
    const subsidies: SubsidyIndexItem[] = JSON.parse(fs.readFileSync(file, "utf-8"))

    return subsidies.reduce(
      (stats, subsidy) => {
        stats.total += 1
        stats[subsidy.status] += 1
        return stats
      },
      {
        total: 0,
        open: 0,
        upcoming: 0,
        closed: 0,
        unknown: 0,
      }
    )
  } catch {
    return null
  }
}

function getSortTime(subsidy: NormalizedSubsidy) {
  const date = subsidy.startDate ?? subsidy.updatedAt
  const time = new Date(date).getTime()
  return Number.isNaN(time) ? 0 : time
}

export const metadata: Metadata = {
  title: `${SITE_NAME} | 中小企業・個人事業主向け`,
  description:
    "中小企業・個人事業主向けに、国と東京都の補助金を検索し、事業内容に合う制度を診断できる補助金ポータルです。",
  alternates: {
    canonical: absoluteUrl("/"),
  },
}

const Page: FC = () => {
  const history = getUpdateHistory()
  const stats = getSubsidyStats()
  const latestSubsidies = getLatestSubsidies()
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: SITE_URL,
    inLanguage: "ja",
    description:
      "中小企業・個人事業主向けに、国と東京都の補助金を検索し、事業内容に合う制度を診断できる補助金ポータルです。",
  }

  return (
    <div style={{ maxWidth: "900px", margin: "0 auto" }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <section style={{ textAlign: "center", padding: "4rem 0 3rem" }}>
        <h1
          style={{
            fontSize: "2rem",
            fontWeight: "bold",
            color: "var(--text-strong)",
            marginBottom: "1rem",
            lineHeight: 1.3,
          }}
        >
          あなたの事業に合った補助金を
          <br />
          かんたん診断
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: "1rem", marginBottom: "2.5rem", lineHeight: 1.7 }}>
          事業形態・業種・従業員数などを入力するだけで、
          <br />
          国・東京都の補助金をスコアリングして最適なものをご提案します。
        </p>
        <Link
          href="/diagnosis"
          style={{
            display: "inline-block",
            backgroundColor: "#38b48b",
            color: "#fff",
            padding: "0.875rem 2.5rem",
            borderRadius: "8px",
            textDecoration: "none",
            fontWeight: "bold",
            fontSize: "1.05rem",
            boxShadow: "0 4px 14px rgba(56,180,139,0.4)",
          }}
        >
          診断をはじめる
        </Link>
      </section>

      <section style={{ marginBottom: "3rem" }}>
        <h2 style={{ color: "var(--text-strong)", fontSize: "1.1rem", marginBottom: "1rem" }}>
          補助金ポータルでできること
        </h2>
        <div style={{ color: "var(--text-base)", fontSize: ".95rem", lineHeight: 1.9 }}>
          <p style={{ marginBottom: ".8rem" }}>
            補助金ポータルは、中小企業や個人事業主が使える補助金を探しやすくするためのサイトです。
            国の補助金だけでなく、東京都の制度もまとめて確認できます。
          </p>
          <p>
            補助金一覧ページでは制度を比較でき、診断ページでは所在地・業種・従業員数・用途から、
            自社に合いやすい補助金を絞り込めます。
          </p>
        </div>
      </section>

      {latestSubsidies.length > 0 && (
        <section style={{ marginBottom: "3rem" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "baseline",
              gap: "1rem",
              marginBottom: "1rem",
            }}
          >
            <h2 style={{ color: "var(--text-strong)", fontSize: "1.1rem" }}>
              最新の補助金
            </h2>
            <Link
              href="/subsidies"
              style={{
                color: "#38b48b",
                textDecoration: "none",
                fontSize: ".85rem",
                whiteSpace: "nowrap",
              }}
            >
              一覧で探す →
            </Link>
          </div>
          <div style={{ display: "grid", gap: ".75rem" }}>
            {latestSubsidies.map((subsidy) => (
              <Link
                key={subsidy.id}
                href={`/subsidies/${subsidy.slug}`}
                style={{ textDecoration: "none" }}
              >
                <article
                  style={{
                    backgroundColor: "var(--bg-surface)",
                    border: "1px solid var(--border-soft)",
                    borderRadius: "10px",
                    padding: "1rem 1.15rem",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      gap: ".5rem",
                      flexWrap: "wrap",
                      alignItems: "center",
                      marginBottom: ".55rem",
                    }}
                  >
                    <span
                      style={{
                        backgroundColor: "#22c55e22",
                        color: "#22c55e",
                        border: "1px solid #22c55e44",
                        borderRadius: "999px",
                        padding: ".1rem .55rem",
                        fontSize: ".72rem",
                      }}
                    >
                      {subsidy.status === "upcoming" ? "公募前" : "受付中"}
                    </span>
                    {subsidy.startDate && (
                      <span style={{ color: "var(--text-muted)", fontSize: ".78rem" }}>
                        受付開始 {subsidy.startDate}
                      </span>
                    )}
                    {subsidy.upperLimit && (
                      <span style={{ color: "#f59e0b", fontSize: ".78rem", marginLeft: "auto" }}>
                        上限 {subsidy.upperLimit}
                      </span>
                    )}
                  </div>
                  <h3
                    style={{
                      color: "var(--text-strong)",
                      fontSize: ".95rem",
                      lineHeight: 1.5,
                      marginBottom: ".5rem",
                    }}
                  >
                    {subsidy.title}
                  </h3>
                  {subsidy.purposes.length > 0 && (
                    <div style={{ display: "flex", gap: ".4rem", flexWrap: "wrap" }}>
                      {subsidy.purposes.slice(0, 3).map((purpose) => (
                        <span
                          key={purpose}
                          style={{
                            backgroundColor: "var(--bg-tag)",
                            color: "#38b48b",
                            borderRadius: "4px",
                            padding: ".08rem .4rem",
                            fontSize: ".72rem",
                          }}
                        >
                          {purpose}
                        </span>
                      ))}
                    </div>
                  )}
                </article>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "1rem",
          marginBottom: "3rem",
        }}
      >
        {[
          { label: "登録補助金数", value: stats ? `${stats.total}件` : "—" },
          { label: "受付中", value: stats ? `${stats.open}件` : "—" },
          { label: "公募前", value: stats ? `${stats.upcoming}件` : "—" },
          { label: "終了", value: stats ? `${stats.closed}件` : "—" },
          { label: "JグランツAPI連携", value: history ? `${history.sources.jgrants}件` : "—" },
          {
            label: "最終更新",
            value: history
              ? new Date(history.lastUpdated).toLocaleDateString("ja-JP")
              : "未取得",
          },
        ].map((stat) => (
          <div
            key={stat.label}
            style={{
              backgroundColor: "var(--bg-surface)",
              borderRadius: "8px",
              padding: "1.25rem",
              textAlign: "center",
              border: "1px solid var(--border-soft)",
            }}
          >
            <div style={{ color: "#38b48b", fontSize: "1.5rem", fontWeight: "bold" }}>
              {stat.value}
            </div>
            <div style={{ color: "var(--text-muted)", fontSize: ".8rem", marginTop: ".25rem" }}>
              {stat.label}
            </div>
          </div>
        ))}
      </section>

      <section style={{ textAlign: "center", paddingBottom: "2rem" }}>
        <Link
          href="/subsidies"
          style={{
            color: "#38b48b",
            textDecoration: "none",
            fontSize: ".9rem",
          }}
        >
          すべての補助金一覧を見る →
        </Link>
      </section>
    </div>
  )
}

export default Page
