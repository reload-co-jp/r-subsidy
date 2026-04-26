import { FC } from "react"
import Link from "next/link"
import Image from "next/image"
import fs from "fs"
import path from "path"
import type { Metadata } from "next"
import { POPULAR_PREFECTURES } from "../lib/prefectures"
import type {
  NormalizedSubsidy,
  SubsidyIndexItem,
  UpdateHistory,
} from "../lib/types"
import { SITE_NAME, SITE_URL, absoluteUrl } from "../lib/site"
import { formatDate, formatAmount } from "../lib/format"
import PurposeTagLink from "../components/elements/purpose-tag-link"

function getUpdateHistory(): UpdateHistory | null {
  try {
    const file = path.join(
      process.cwd(),
      "data",
      "generated",
      "update-history.json"
    )
    return JSON.parse(fs.readFileSync(file, "utf-8"))
  } catch {
    return null
  }
}

function getLatestSubsidies(): NormalizedSubsidy[] {
  try {
    const file = path.join(
      process.cwd(),
      "data",
      "generated",
      "subsidies-master.json"
    )
    const subsidies: NormalizedSubsidy[] = JSON.parse(
      fs.readFileSync(file, "utf-8")
    )

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
    const file = path.join(
      process.cwd(),
      "data",
      "generated",
      "subsidies-index.json"
    )
    const subsidies: SubsidyIndexItem[] = JSON.parse(
      fs.readFileSync(file, "utf-8")
    )

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
    "中小企業・個人事業主向けに、Jグランツ掲載の補助金を都道府県・受付状態・目的から検索し、事業内容に合う制度を診断できる補助金ポータルです。",
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
      "中小企業・個人事業主向けに、Jグランツ掲載の補助金を都道府県・受付状態・目的から検索し、事業内容に合う制度を診断できる補助金ポータルです。",
    potentialAction: {
      "@type": "SearchAction",
      target: `${SITE_URL}/subsidies/?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  }
  const latestItemList = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "最新の補助金",
    itemListElement: latestSubsidies.map((subsidy, index) => ({
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
      {latestSubsidies.length > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(latestItemList) }}
        />
      )}
      <section
        style={{
          position: "relative",
          borderRadius: "16px",
          overflow: "hidden",
          marginBottom: "3rem",
        }}
      >
        <Image
          src="/images/hero.jpg"
          alt="補助金ポータル"
          width={900}
          height={400}
          priority
          style={{
            width: "100%",
            height: "auto",
            display: "block",
            objectFit: "cover",
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(to right, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.25) 100%)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "flex-start",
            padding: "2.5rem 3rem",
          }}
        >
          <h1
            style={{
              fontSize: "clamp(1.4rem, 3vw, 2rem)",
              fontWeight: "bold",
              color: "#fff",
              marginBottom: "1rem",
              lineHeight: 1.4,
            }}
          >
            あなたの事業に合った補助金を
            <br />
            かんたん診断
          </h1>
          <p
            style={{
              color: "rgba(255,255,255,0.85)",
              fontSize: "clamp(0.85rem, 1.5vw, 1rem)",
              marginBottom: "2rem",
              lineHeight: 1.7,
            }}
          >
            事業形態・業種・従業員数などを入力するだけで、
            <br />
            Jグランツ掲載の補助金をスコアリングして最適なものをご提案します。
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
        </div>
      </section>

      <section style={{ marginBottom: "3rem" }}>
        <h2
          style={{
            color: "var(--text-strong)",
            fontSize: "1.1rem",
            marginBottom: "1rem",
          }}
        >
          補助金ポータルでできること
        </h2>
        <div
          style={{
            color: "var(--text-base)",
            fontSize: ".95rem",
            lineHeight: 1.9,
          }}
        >
          <p style={{ marginBottom: ".8rem" }}>
            補助金ポータルは、中小企業や個人事業主が使える補助金を探しやすくするためのサイトです。
            Jグランツ掲載の制度を、都道府県・受付状態・目的からまとめて確認できます。
          </p>
          <p>
            補助金一覧ページでは制度を比較でき、診断ページでは所在地・業種・従業員数・用途から、
            自社に合いやすい補助金を絞り込めます。
          </p>
        </div>
      </section>

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
            都道府県から補助金を探す
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
            条件検索へ →
          </Link>
        </div>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: ".5rem",
          }}
        >
          {POPULAR_PREFECTURES.map((prefecture) => (
            <Link
              key={prefecture}
              href={`/subsidies/prefecture/${encodeURIComponent(prefecture)}`}
              style={{
                backgroundColor: "var(--bg-surface)",
                border: "1px solid var(--border-soft)",
                borderRadius: "999px",
                color: "var(--text-base)",
                fontSize: ".82rem",
                padding: ".42rem .72rem",
                textDecoration: "none",
              }}
            >
              {prefecture}
            </Link>
          ))}
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
                      <span
                        style={{
                          color: "var(--text-muted)",
                          fontSize: ".78rem",
                        }}
                      >
                        受付開始 {formatDate(subsidy.startDate)}
                      </span>
                    )}
                    {subsidy.upperLimit && subsidy.upperLimit !== "0円" && (
                      <span
                        style={{
                          color: "#f59e0b",
                          fontSize: ".78rem",
                          marginLeft: "auto",
                        }}
                      >
                        上限 {formatAmount(subsidy.upperLimit)}
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
                  {subsidy.overview && (
                    <p
                      style={{
                        color: "var(--text-muted)",
                        fontSize: ".78rem",
                        lineHeight: 1.6,
                        marginBottom: ".5rem",
                        overflow: "hidden",
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                      }}
                    >
                      {subsidy.overview}
                    </p>
                  )}
                  {subsidy.purposes.length > 0 && (
                    <div
                      style={{
                        display: "flex",
                        gap: ".4rem",
                        flexWrap: "wrap",
                      }}
                    >
                      {subsidy.purposes.slice(0, 3).map((purpose) => (
                        <PurposeTagLink key={purpose} purpose={purpose} />
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
          {
            label: "JグランツAPI連携",
            value: history ? `${history.sources.jgrants}件` : "—",
          },
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
            <div
              style={{
                color: "#38b48b",
                fontSize: "1.5rem",
                fontWeight: "bold",
              }}
            >
              {stat.value}
            </div>
            <div
              style={{
                color: "var(--text-muted)",
                fontSize: ".8rem",
                marginTop: ".25rem",
              }}
            >
              {stat.label}
            </div>
          </div>
        ))}
      </section>

      <section style={{ textAlign: "center", paddingBottom: "2rem" }}>
        <Link
          href="/subsidies"
          style={{
            display: "inline-block",
            backgroundColor: "#38b48b",
            color: "#fff",
            textDecoration: "none",
            fontSize: "1rem",
            fontWeight: "bold",
            padding: ".75rem 2rem",
            borderRadius: "8px",
          }}
        >
          すべての補助金一覧を見る →
        </Link>
      </section>
    </div>
  )
}

export default Page
