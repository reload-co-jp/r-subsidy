import { FC } from "react"
import Link from "next/link"
import fs from "fs"
import path from "path"
import type { Metadata } from "next"
import type { NormalizedSubsidy, SubsidyIndexItem } from "../../../lib/types"
import { SITE_NAME, absoluteUrl } from "../../../lib/site"

export const dynamicParams = false

export function generateStaticParams(): { slug: string }[] {
  try {
    const file = path.join(
      process.cwd(),
      "data",
      "generated",
      "subsidies-index.json"
    )
    const index: SubsidyIndexItem[] = JSON.parse(fs.readFileSync(file, "utf-8"))
    return index.map((s) => ({ slug: s.slug }))
  } catch {
    return []
  }
}

function getSubsidy(slug: string): NormalizedSubsidy | null {
  try {
    const file = path.join(
      process.cwd(),
      "data",
      "generated",
      "subsidies-detail",
      `${slug}.json`
    )
    return JSON.parse(fs.readFileSync(file, "utf-8"))
  } catch {
    return null
  }
}

function buildDescription(subsidy: NormalizedSubsidy) {
  const parts = [
    subsidy.overview,
    subsidy.upperLimit ? `補助上限額は${subsidy.upperLimit}` : null,
    subsidy.subsidizedRate ? `補助率は${subsidy.subsidizedRate}` : null,
    subsidy.purposes.length > 0
      ? `対象用途は${subsidy.purposes.join("・")}`
      : null,
  ].filter(Boolean)

  return parts.join("。").slice(0, 140)
}

function sanitizeDetailHtml(html: string) {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
    .replace(/<(iframe|object|embed|link|meta|form|input|button)\b[^>]*>/gi, "")
    .replace(/\son\w+=(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(/\s(href|src)=["']\s*javascript:[^"']*["']/gi, "")
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const subsidy = getSubsidy(slug)

  if (!subsidy) {
    return {
      title: `補助金が見つかりません | ${SITE_NAME}`,
      robots: {
        index: false,
        follow: false,
      },
    }
  }

  const description = buildDescription(subsidy)
  const pageUrl = absoluteUrl(`/subsidies/${subsidy.slug}/`)

  return {
    title: `${subsidy.title} | ${SITE_NAME}`,
    description,
    alternates: {
      canonical: pageUrl,
    },
    openGraph: {
      title: `${subsidy.title} | ${SITE_NAME}`,
      description,
      url: pageUrl,
      type: "article",
    },
  }
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

type Props = { params: Promise<{ slug: string }> }

const Page: FC<Props> = async ({ params }) => {
  const { slug } = await params
  const subsidy = getSubsidy(slug)

  if (!subsidy) {
    return (
      <div
        style={{
          maxWidth: "800px",
          margin: "0 auto",
          textAlign: "center",
          padding: "4rem 0",
        }}
      >
        <p style={{ color: "var(--text-muted)", marginBottom: "1rem" }}>
          補助金が見つかりませんでした
        </p>
        <Link
          href="/subsidies"
          style={{
            color: "#38b48b",
            textDecoration: "none",
            fontSize: ".875rem",
          }}
        >
          ← 補助金一覧に戻る
        </Link>
      </div>
    )
  }

  const st = statusLabel[subsidy.status] ?? statusLabel.unknown
  const pageUrl = absoluteUrl(`/subsidies/${subsidy.slug}/`)
  const description = buildDescription(subsidy)
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: subsidy.title,
    url: pageUrl,
    inLanguage: "ja",
    description,
    dateModified: subsidy.updatedAt,
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
          name: subsidy.title,
          item: pageUrl,
        },
      ],
    },
  }

  const infoRows: { label: string; value: string | null }[] = [
    { label: "対象地域", value: regionLabel[subsidy.region] ?? subsidy.region },
    { label: "補助率", value: subsidy.subsidizedRate },
    { label: "補助上限額", value: subsidy.upperLimit },
    { label: "補助下限額", value: subsidy.lowerLimit },
    { label: "受付開始", value: subsidy.startDate },
    { label: "受付終了", value: subsidy.endDate },
    {
      label: "従業員数",
      value:
        subsidy.employeeMin !== null || subsidy.employeeMax !== null
          ? `${subsidy.employeeMin ?? "—"}〜${subsidy.employeeMax ?? "—"}人`
          : null,
    },
    { label: "申請窓口", value: subsidy.workflow },
    {
      label: "出典",
      value:
        subsidy.source === "jgrants"
          ? "Jグランツ"
          : subsidy.source === "tokyo"
            ? "東京都"
            : "手動登録",
    },
  ]

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto" }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <div style={{ marginBottom: "1.5rem" }}>
        <Link
          href="/subsidies"
          style={{
            color: "#38b48b",
            textDecoration: "none",
            fontSize: ".875rem",
          }}
        >
          ← 補助金一覧
        </Link>
      </div>

      <div
        style={{
          backgroundColor: "var(--bg-surface)",
          borderRadius: "10px",
          padding: "1.5rem",
          border: "1px solid var(--border-soft)",
          marginBottom: "1.5rem",
        }}
      >
        <div
          style={{
            display: "flex",
            gap: ".75rem",
            marginBottom: "1rem",
            flexWrap: "wrap",
          }}
        >
          <span
            style={{
              backgroundColor: st.color + "22",
              color: st.color,
              border: `1px solid ${st.color}44`,
              borderRadius: "4px",
              padding: ".2rem .6rem",
              fontSize: ".8rem",
            }}
          >
            {st.label}
          </span>
          <span
            style={{
              backgroundColor: "var(--bg-surface-alt)",
              color: "#94a3b8",
              borderRadius: "4px",
              padding: ".2rem .6rem",
              fontSize: ".8rem",
            }}
          >
            {regionLabel[subsidy.region] ?? subsidy.region}
          </span>
          {subsidy.prefectures.length > 0 && subsidy.region !== "national" && (
            <span
              style={{ color: "var(--text-muted)", fontSize: ".8rem", alignSelf: "center" }}
            >
              {subsidy.prefectures.join("、")}
            </span>
          )}
        </div>

        <h1
          style={{
            color: "var(--text-strong)",
            fontSize: "1.3rem",
            fontWeight: "bold",
            marginBottom: "1rem",
          }}
        >
          {subsidy.title}
        </h1>

        {subsidy.workflow && (
          <div
            style={{
              backgroundColor: "#38b48b22",
              border: "1px solid #38b48b44",
              borderRadius: "6px",
              padding: ".75rem 1rem",
              marginBottom: "1rem",
              color: "#38b48b",
              fontSize: ".875rem",
            }}
          >
            <strong>申請窓口：</strong> {subsidy.workflow}
          </div>
        )}

        {subsidy.overview && (
          <p style={{ color: "var(--text-base)", fontSize: ".9rem", lineHeight: 1.7 }}>
            {subsidy.overview}
          </p>
        )}
      </div>

      <div
        style={{
          backgroundColor: "var(--bg-surface)",
          borderRadius: "10px",
          border: "1px solid var(--border-soft)",
          marginBottom: "1.5rem",
          overflow: "hidden",
        }}
      >
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <tbody>
            {infoRows
              .filter((r) => r.value)
              .map((row) => (
                <tr
                  key={row.label}
                  style={{ borderBottom: "1px solid #2a3a5a" }}
                >
                  <td
                    style={{
                      padding: ".75rem 1rem",
                      color: "var(--text-muted)",
                      fontSize: ".8rem",
                      width: "140px",
                      whiteSpace: "nowrap",
                      verticalAlign: "top",
                    }}
                  >
                    {row.label}
                  </td>
                  <td
                    style={{
                      padding: ".75rem 1rem",
                      color: "var(--text-strong)",
                      fontSize: ".9rem",
                    }}
                  >
                    {row.value}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {subsidy.purposes.length > 0 && (
        <div style={{ marginBottom: "1.5rem" }}>
          <h2
            style={{ color: "var(--text-muted)", fontSize: ".8rem", marginBottom: ".5rem" }}
          >
            対象用途
          </h2>
          <div style={{ display: "flex", gap: ".5rem", flexWrap: "wrap" }}>
            {subsidy.purposes.map((p) => (
              <span
                key={p}
                style={{
                  backgroundColor: "var(--bg-tag)",
                  color: "#38b48b",
                  borderRadius: "4px",
                  padding: ".25rem .6rem",
                  fontSize: ".8rem",
                }}
              >
                {p}
              </span>
            ))}
          </div>
        </div>
      )}

      {subsidy.industries.length > 0 && (
        <div style={{ marginBottom: "1.5rem" }}>
          <h2
            style={{ color: "var(--text-muted)", fontSize: ".8rem", marginBottom: ".5rem" }}
          >
            対象業種
          </h2>
          <div style={{ display: "flex", gap: ".5rem", flexWrap: "wrap" }}>
            {subsidy.industries.map((ind) => (
              <span
                key={ind}
                style={{
                  backgroundColor: "var(--bg-surface-alt)",
                  color: "var(--text-base)",
                  borderRadius: "4px",
                  padding: ".25rem .6rem",
                  fontSize: ".8rem",
                }}
              >
                {ind}
              </span>
            ))}
          </div>
        </div>
      )}

      {subsidy.detail && (
        <div
          style={{
            backgroundColor: "var(--bg-surface)",
            borderRadius: "10px",
            padding: "1.25rem",
            border: "1px solid var(--border-soft)",
            marginBottom: "1.5rem",
          }}
        >
          <h2
            style={{ color: "var(--text-muted)", fontSize: ".8rem", marginBottom: ".75rem" }}
          >
            詳細
          </h2>
          <div
            className="rich-html"
            dangerouslySetInnerHTML={{ __html: sanitizeDetailHtml(subsidy.detail) }}
          />
        </div>
      )}

      {subsidy.referenceUrl && (
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <a
            href={subsidy.referenceUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "inline-block",
              backgroundColor: "#38b48b",
              color: "#fff",
              padding: ".75rem 2rem",
              borderRadius: "8px",
              textDecoration: "none",
              fontWeight: "bold",
              fontSize: ".9rem",
            }}
          >
            公式ページを見る →
          </a>
        </div>
      )}

      <div style={{ textAlign: "center" }}>
        <Link
          href="/diagnosis"
          style={{
            color: "#38b48b",
            textDecoration: "none",
            fontSize: ".875rem",
          }}
        >
          この補助金との適合度を診断する →
        </Link>
      </div>
    </div>
  )
}

export default Page
