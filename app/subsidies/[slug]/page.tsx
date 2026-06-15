import { FC } from "react"
import Link from "next/link"
import { Breadcrumb } from "../../../components/elements/breadcrumb"
import fs from "fs"
import path from "path"
import type { Metadata } from "next"
import type { NormalizedSubsidy, SubsidyIndexItem } from "../../../lib/types"
import { SITE_NAME, DEFAULT_OG_IMAGE, absoluteUrl } from "../../../lib/site"
import { formatDate, formatAmount } from "../../../lib/format"

function getRelatedSubsidies(subsidy: NormalizedSubsidy): SubsidyIndexItem[] {
  try {
    const file = path.join(process.cwd(), "data", "generated", "subsidies-index.json")
    const all: SubsidyIndexItem[] = JSON.parse(fs.readFileSync(file, "utf-8"))
    const active = all.filter((s) => s.slug !== subsidy.slug && s.status !== "closed")
    const byPurpose = active.filter((s) =>
      s.purposes.some((p) => subsidy.purposes.includes(p))
    )
    if (byPurpose.length >= 3) return byPurpose.slice(0, 5)
    const byPrefecture = active.filter(
      (s) =>
        subsidy.prefectures.length > 0 &&
        s.prefectures.some((p) => subsidy.prefectures.includes(p))
    )
    const merged = [...byPurpose, ...byPrefecture.filter((s) => !byPurpose.some((b) => b.slug === s.slug))]
    return merged.slice(0, 5)
  } catch {
    return []
  }
}

type FaqItem = { question: string; answer: string }

function buildFaqItems(subsidy: NormalizedSubsidy): FaqItem[] {
  const regionLabel: Record<string, string> = { national: "全国", tokyo: "東京都", prefecture: "都道府県" }
  const items: FaqItem[] = []

  const region =
    subsidy.region === "prefecture" && subsidy.prefectures.length > 0
      ? `都道府県（${subsidy.prefectures.join("、")}）`
      : (regionLabel[subsidy.region] ?? subsidy.region)
  items.push({ question: `対象地域は?`, answer: region })

  if (subsidy.subsidizedRate) {
    items.push({ question: `補助率は?`, answer: subsidy.subsidizedRate })
  }

  if (subsidy.upperLimit && subsidy.upperLimit !== "0円") {
    items.push({
      question: `補助上限額は?`,
      answer: formatAmount(subsidy.upperLimit) ?? subsidy.upperLimit,
    })
  }

  if (subsidy.startDate || subsidy.endDate) {
    const start = subsidy.startDate ? formatDate(subsidy.startDate) : "未定"
    const end = subsidy.endDate ? formatDate(subsidy.endDate) : "未定"
    items.push({ question: `受付期間は?`, answer: `${start} 〜 ${end}` })
  }

  if (subsidy.industries.length > 0) {
    items.push({
      question: `どの業種が対象?`,
      answer: subsidy.industries.join("、"),
    })
  }

  if (subsidy.workflow) {
    items.push({ question: `申請窓口は?`, answer: subsidy.workflow })
  }

  return items
}

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

function getLawyerComment(slug: string): string | null {
  try {
    const file = path.join(
      process.cwd(),
      "data",
      "source",
      "lawyer-comments.json"
    )
    const raw = JSON.parse(fs.readFileSync(file, "utf-8"))
    return raw[slug] ?? null
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

  const full = parts.join("。")
  if (full.length <= 140) return full
  const truncated = full.slice(0, 140)
  const lastPeriod = truncated.lastIndexOf("。")
  return lastPeriod > 0 ? truncated.slice(0, lastPeriod + 1) : truncated
}

function escapeHtml(text: string) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
}

function plainTextToHtml(text: string) {
  return text
    .split(/\n\n+/)
    .map((block) => {
      const headingMatch = block.match(/^【([^】]+)】\n?([\s\S]*)/)
      if (headingMatch) {
        const rest = headingMatch[2].trim()
        return `<h2>${escapeHtml(headingMatch[1])}</h2>${rest ? `<p>${escapeHtml(rest).replace(/\n/g, "<br>")}</p>` : ""}`
      }
      if (block.startsWith("【") && block.endsWith("】")) {
        return `<h2>${escapeHtml(block.slice(1, -1))}</h2>`
      }
      const lines = block.split("\n")
      const isList = lines.every((l) => /^[-・]/.test(l.trim()) || l.trim() === "")
      if (isList) {
        const items = lines.filter((l) => l.trim()).map((l) => `<li>${escapeHtml(l.replace(/^[-・]\s*/, ""))}</li>`).join("")
        return `<ul>${items}</ul>`
      }
      return `<p>${escapeHtml(block).replace(/\n/g, "<br>")}</p>`
    })
    .join("")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
}

function sanitizeDetailHtml(html: string) {
  const isHtml = /<[a-z][\s\S]*>/i.test(html)
  if (!isHtml) return plainTextToHtml(html)
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

  const ogImage = { url: absoluteUrl(DEFAULT_OG_IMAGE), width: 1200, height: 630, alt: subsidy.title }

  return {
    title: `${subsidy.title} | ${SITE_NAME}`,
    description,
    alternates: {
      canonical: pageUrl,
    },
    ...(subsidy.status === "closed" ? { robots: { index: false, follow: true } } : {}),
    openGraph: {
      title: `${subsidy.title} | ${SITE_NAME}`,
      description,
      url: pageUrl,
      type: "article",
      modifiedTime: subsidy.updatedAt,
      images: [ogImage],
    },
    twitter: {
      card: "summary_large_image",
      title: `${subsidy.title} | ${SITE_NAME}`,
      description,
      images: [ogImage.url],
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
  const lawyerComment = getLawyerComment(slug)

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
  const relatedSubsidies = getRelatedSubsidies(subsidy)
  const faqItems = buildFaqItems(subsidy)
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: subsidy.title,
    url: pageUrl,
    inLanguage: "ja",
    description,
    datePublished: subsidy.startDate ?? subsidy.updatedAt,
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
    {
      label: "対象地域",
      value:
        subsidy.region === "prefecture" && subsidy.prefectures.length > 0
          ? `都道府県（${subsidy.prefectures.join("、")}）`
          : (regionLabel[subsidy.region] ?? subsidy.region),
    },
    { label: "補助率", value: subsidy.subsidizedRate },
    {
      label: "補助上限額",
      value: subsidy.upperLimit === "0円" ? "情報なし" : formatAmount(subsidy.upperLimit),
    },
    { label: "補助下限額", value: formatAmount(subsidy.lowerLimit) },
    { label: "受付開始", value: formatDate(subsidy.startDate) },
    { label: "受付終了", value: formatDate(subsidy.endDate) },
    {
      label: "対象従業員数",
      value:
        subsidy.targetNumberOfEmployees ??
        (subsidy.employeeMin !== null || subsidy.employeeMax !== null
          ? `${subsidy.employeeMin ?? "—"}〜${subsidy.employeeMax ?? "—"}人`
          : null),
    },
    { label: "利用目的", value: subsidy.usePurpose },
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
    <div className="page-content">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      {faqItems.length > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "FAQPage",
              mainEntity: faqItems.map((item) => ({
                "@type": "Question",
                name: item.question,
                acceptedAnswer: { "@type": "Answer", text: item.answer },
              })),
            }),
          }}
        />
      )}
      <Breadcrumb
        items={[
          { label: "ホーム", href: "/" },
          { label: "補助金一覧", href: "/subsidies" },
          { label: subsidy.title },
        ]}
      />

      <div
        style={{
          backgroundColor: "var(--bg-surface)",
          borderRadius: "10px",
          padding: "1.5rem",
          border: "1px solid var(--border-strong)",
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
              color: "var(--text-base)",
              borderRadius: "4px",
              padding: ".2rem .6rem",
              fontSize: ".8rem",
              border: "1px solid var(--border-strong)",
            }}
          >
            {regionLabel[subsidy.region] ?? subsidy.region}
          </span>
          {subsidy.prefectures.length > 0 && subsidy.region !== "national" && (
            <span
              style={{
                color: "var(--text-muted)",
                fontSize: ".8rem",
                alignSelf: "center",
              }}
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
          <p
            style={{
              color: "var(--text-base)",
              fontSize: ".9rem",
              lineHeight: 1.7,
            }}
          >
            {subsidy.overview}
          </p>
        )}
      </div>

      {lawyerComment && (
        <div
          style={{
            backgroundColor: "#f0fdf8",
            border: "1px solid #a7f3d0",
            borderRadius: "10px",
            padding: "1.25rem",
            marginBottom: "1.5rem",
          }}
        >
          <h2
            style={{
              color: "#059669",
              fontSize: ".85rem",
              fontWeight: "bold",
              marginBottom: ".75rem",
            }}
          >
            行政書士コメント
          </h2>
          <p
            style={{
              color: "#064e3b",
              fontSize: ".9rem",
              lineHeight: 1.7,
              margin: 0,
            }}
          >
            {lawyerComment}
          </p>
        </div>
      )}

      <div
        style={{
          backgroundColor: "var(--bg-surface)",
          borderRadius: "10px",
          border: "1px solid var(--border-strong)",
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
                  style={{ borderBottom: "1px solid var(--border-strong)" }}
                >
                  <td
                    style={{
                      padding: ".75rem 1rem",
                      color: "var(--text-base)",
                      fontSize: ".8rem",
                      width: "140px",
                      whiteSpace: "nowrap",
                      verticalAlign: "top",
                      fontWeight: "500",
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
            style={{
              color: "var(--text-base)",
              fontSize: ".85rem",
              fontWeight: "600",
              marginBottom: ".5rem",
            }}
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
            style={{
              color: "var(--text-base)",
              fontSize: ".85rem",
              fontWeight: "600",
              marginBottom: ".5rem",
            }}
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
            border: "1px solid var(--border-strong)",
            marginBottom: "1.5rem",
          }}
        >
          <h2
            style={{
              color: "var(--text-base)",
              fontSize: ".85rem",
              fontWeight: "600",
              marginBottom: ".75rem",
            }}
          >
            詳細
          </h2>
          <div
            className="rich-html"
            dangerouslySetInnerHTML={{
              __html: sanitizeDetailHtml(subsidy.detail),
            }}
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

      {faqItems.length > 0 && (
        <div
          style={{
            backgroundColor: "var(--bg-surface)",
            borderRadius: "10px",
            border: "1px solid var(--border-soft)",
            marginBottom: "1.5rem",
            overflow: "hidden",
          }}
        >
          <h2
            style={{
              color: "var(--text-base)",
              fontSize: ".85rem",
              fontWeight: "600",
              padding: ".75rem 1rem",
              borderBottom: "1px solid var(--border-strong)",
              margin: 0,
            }}
          >
            よくある質問
          </h2>
          {faqItems.map((item, i) => (
            <div
              key={i}
              style={{
                borderBottom: i < faqItems.length - 1 ? "1px solid var(--border-strong)" : undefined,
                padding: ".85rem 1rem",
              }}
            >
              <p style={{ color: "#38b48b", fontSize: ".82rem", fontWeight: "bold", marginBottom: ".35rem" }}>
                Q. {item.question}
              </p>
              <p style={{ color: "var(--text-strong)", fontSize: ".88rem", margin: 0 }}>
                A. {item.answer}
              </p>
            </div>
          ))}
        </div>
      )}

      {relatedSubsidies.length > 0 && (
        <div style={{ marginBottom: "1.5rem" }}>
          <h2
            style={{
              color: "var(--text-base)",
              fontSize: ".85rem",
              fontWeight: "600",
              marginBottom: ".75rem",
            }}
          >
            関連する補助金
          </h2>
          <div style={{ display: "grid", gap: ".5rem" }}>
            {relatedSubsidies.map((s) => (
              <Link
                key={s.slug}
                href={`/subsidies/${s.slug}`}
                style={{
                  backgroundColor: "var(--bg-surface)",
                  border: "1px solid var(--border-soft)",
                  borderRadius: "8px",
                  padding: ".75rem 1rem",
                  textDecoration: "none",
                  display: "block",
                }}
              >
                <span
                  style={{
                    backgroundColor:
                      s.status === "open" ? "#22c55e22" : "#f59e0b22",
                    color: s.status === "open" ? "#22c55e" : "#f59e0b",
                    border: `1px solid ${s.status === "open" ? "#22c55e44" : "#f59e0b44"}`,
                    borderRadius: "4px",
                    padding: ".1rem .45rem",
                    fontSize: ".72rem",
                    marginRight: ".5rem",
                  }}
                >
                  {s.status === "open" ? "受付中" : "公募前"}
                </span>
                <span style={{ color: "var(--text-strong)", fontSize: ".88rem" }}>
                  {s.title}
                </span>
              </Link>
            ))}
          </div>
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
