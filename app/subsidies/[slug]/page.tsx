import { FC } from "react"
import Link from "next/link"
import { Breadcrumb } from "../../../components/elements/breadcrumb"
import FaqSection, { buildFaqStructuredData } from "../../../components/elements/faq-section"
import fs from "fs"
import path from "path"
import type { Metadata } from "next"
import type { NormalizedSubsidy, SubsidyIndexItem } from "../../../lib/types"
import {
  SITE_NAME,
  DEFAULT_OG_IMAGE,
  absoluteUrl,
  buildBreadcrumbList,
} from "../../../lib/site"
import { formatDate, formatAmount } from "../../../lib/format"
import { isPrefecture } from "../../../lib/prefectures"
import {
  areaLabel,
  isActive,
  isLocalTo,
  loadSubsidyIndex,
  purposeLabel,
  subsidyTitle,
} from "../../../lib/seo"

type RelatedGroup = { heading: string; href: string; linkLabel: string; items: SubsidyIndexItem[] }

// 業種がほぼ全業種指定の制度は「業種を問わない」扱い
const ALL_INDUSTRY_THRESHOLD = 30

function industryLabel(subsidy: NormalizedSubsidy) {
  if (subsidy.industries.length === 0) return null
  if (subsidy.industries.length >= ALL_INDUSTRY_THRESHOLD) return "業種を問わず幅広い業種が対象"
  return subsidy.industries.join("、")
}

function getLocalPrefecture(subsidy: NormalizedSubsidy) {
  return subsidy.region !== "national" ? subsidy.prefectures.find(isPrefecture) ?? null : null
}

function getRelatedGroups(subsidy: NormalizedSubsidy): RelatedGroup[] {
  const active = loadSubsidyIndex().filter((s) => s.slug !== subsidy.slug && isActive(s))
  const used = new Set<string>()
  const pick = (items: SubsidyIndexItem[]) => {
    const picked = items.filter((s) => !used.has(s.slug)).slice(0, 5)
    picked.forEach((s) => used.add(s.slug))
    return picked
  }
  const groups: RelatedGroup[] = []
  const prefecture = getLocalPrefecture(subsidy)
  if (prefecture) {
    groups.push({
      heading: `${prefecture}の補助金`,
      href: `/subsidies/prefecture/${encodeURIComponent(prefecture)}/`,
      linkLabel: `${prefecture}の補助金一覧へ`,
      items: pick(active.filter((s) => isLocalTo(s, prefecture))),
    })
  }
  const purpose = subsidy.purposes[0]
  if (purpose) {
    groups.push({
      heading: `${purposeLabel(purpose)}に使える補助金`,
      href: `/subsidies/purpose/${encodeURIComponent(purpose)}/`,
      linkLabel: `${purposeLabel(purpose)}の補助金一覧へ`,
      items: pick(active.filter((s) => s.purposes.includes(purpose))),
    })
  }
  const industry = subsidy.industries.length < ALL_INDUSTRY_THRESHOLD ? subsidy.industries[0] : undefined
  if (industry) {
    groups.push({
      heading: `${industry}向けの補助金`,
      href: `/subsidies/industry/${encodeURIComponent(industry)}/`,
      linkLabel: `${industry}向け補助金一覧へ`,
      items: pick(active.filter((s) => s.industries.includes(industry))),
    })
  }
  // 地域制度の利用者も併用を検討できる、用途が近い国（全国対象）の制度
  groups.push({
    heading: "関連する全国の補助金",
    href: "/subsidies/",
    linkLabel: "全国の補助金一覧へ",
    items: pick(
      active.filter((s) => areaLabel(s) === "全国" && s.purposes.some((p) => subsidy.purposes.includes(p)))
    ),
  })
  return groups.filter((g) => g.items.length > 0)
}

type FaqItem = { question: string; answer: string }

// 制度データから事実として回答できる質問のみ生成する
function buildFaqItems(subsidy: NormalizedSubsidy): FaqItem[] {
  const items: FaqItem[] = []
  const name = subsidy.title

  items.push({ question: `${name}の対象地域は?`, answer: areaLabel(subsidy) === "全国" ? "全国が対象です。" : `${subsidy.prefectures.join("、")}が対象です。` })

  if (subsidy.subsidizedRate) {
    items.push({ question: `${name}の補助率はいくら?`, answer: subsidy.subsidizedRate })
  }

  if (subsidy.upperLimit && subsidy.upperLimit !== "0円") {
    items.push({
      question: `${name}の補助上限額はいくら?`,
      answer: formatAmount(subsidy.upperLimit) ?? subsidy.upperLimit,
    })
  }

  if (subsidy.startDate || subsidy.endDate) {
    const start = subsidy.startDate ? formatDate(subsidy.startDate) : "未定"
    const end = subsidy.endDate ? formatDate(subsidy.endDate) : "未定"
    items.push({ question: `${name}の受付期間は?`, answer: `${start} 〜 ${end}（${statusLabel[subsidy.status]?.label ?? "要確認"}）` })
  }

  const industries = industryLabel(subsidy)
  if (industries) {
    items.push({ question: `${name}の対象業種は?`, answer: industries })
  }

  if (subsidy.targetNumberOfEmployees) {
    items.push({ question: `${name}の従業員数の条件は?`, answer: subsidy.targetNumberOfEmployees })
  }

  if (subsidy.purposes.includes("デジタル化")) {
    items.push({ question: `${name}はIT導入・DXに利用できる?`, answer: "対象用途に「デジタル化（IT・DX）」が含まれます。対象経費の詳細は公式情報をご確認ください。" })
  }

  if (subsidy.purposes.includes("設備投資")) {
    items.push({ question: `${name}は設備投資に利用できる?`, answer: "対象用途に「設備投資」が含まれます。対象経費の詳細は公式情報をご確認ください。" })
  }

  if (subsidy.workflow) {
    items.push({ question: `${name}の申請窓口は?`, answer: subsidy.workflow })
  }

  return items
}

// ページ冒頭の2〜3文の概要（制度データのみから生成）
function buildSummary(subsidy: NormalizedSubsidy) {
  const area = areaLabel(subsidy)
  const sentences = [`${subsidy.title}は、${area === "全国" ? "全国" : area}の事業者を対象とした補助金・助成金です。`]
  const amount = subsidy.upperLimit && subsidy.upperLimit !== "0円" ? formatAmount(subsidy.upperLimit) : null
  const rate = subsidy.subsidizedRate && subsidy.subsidizedRate.length <= 40 ? subsidy.subsidizedRate : null
  if (amount || rate) {
    sentences.push(
      [amount && `補助上限額は${amount}`, rate && `補助率は${rate}`].filter(Boolean).join("、") + "です。"
    )
  }
  if (subsidy.startDate || subsidy.endDate) {
    sentences.push(
      `受付期間は${formatDate(subsidy.startDate) ?? "未定"}〜${formatDate(subsidy.endDate) ?? "未定"}で、現在は「${statusLabel[subsidy.status]?.label ?? "要確認"}」です。`
    )
  }
  return sentences.join("")
}

export const dynamicParams = false

export function generateStaticParams(): { slug: string }[] {
  return loadSubsidyIndex().map((s) => ({ slug: s.slug }))
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

function clipDescription(text: string) {
  if (text.length <= 140) return text
  const truncated = text.slice(0, 140)
  const lastPeriod = truncated.lastIndexOf("。")
  return lastPeriod > 0 ? truncated.slice(0, lastPeriod + 1) : truncated
}

function buildDescription(subsidy: NormalizedSubsidy) {
  const overviewText = (subsidy.overview?.trim() ?? "")
    .replace(/[\r\n]+/g, "。")
    .replace(/。{2,}/g, "。")

  // 概要が無い制度は、地域別に同文の詳細が多く description が重複するため、制度固有の要約を使う
  if (overviewText.length < 30) {
    const purposes = subsidy.purposes.length > 0 ? `対象用途は${subsidy.purposes.map(purposeLabel).join("・")}。` : ""
    return clipDescription(buildSummary(subsidy) + purposes)
  }

  const parts = [
    overviewText,
    subsidy.upperLimit ? `補助上限額は${subsidy.upperLimit}` : null,
    subsidy.subsidizedRate ? `補助率は${subsidy.subsidizedRate}` : null,
    subsidy.purposes.length > 0
      ? `対象用途は${subsidy.purposes.join("・")}`
      : null,
  ].filter(Boolean)

  return clipDescription(parts.join("。").replace(/。{2,}/g, "。"))
}

function escapeHtml(text: string) {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
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
      const isList = lines.every(
        (l) => /^[-・]/.test(l.trim()) || l.trim() === ""
      )
      if (isList) {
        const items = lines
          .filter((l) => l.trim())
          .map((l) => `<li>${escapeHtml(l.replace(/^[-・]\s*/, ""))}</li>`)
          .join("")
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

function stripHtml(html: string) {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim()
}

function buildSubsidyStructuredData(
  subsidy: NormalizedSubsidy,
  pageUrl: string,
  description: string
) {
  const amount = formatAmount(subsidy.upperLimit)
  const areaServed =
    subsidy.region === "national"
      ? "日本全国"
      : subsidy.prefectures.length > 0
        ? subsidy.prefectures
        : (regionLabel[subsidy.region] ?? subsidy.region)
  const detailText = stripHtml(subsidy.detail).slice(0, 5000)

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${pageUrl}#webpage`,
        name: subsidy.title,
        url: pageUrl,
        inLanguage: "ja",
        description,
        datePublished: subsidy.startDate ?? subsidy.updatedAt,
        dateModified: subsidy.updatedAt,
        mainEntity: { "@id": `${pageUrl}#grant` },
      },
      {
        "@type": "MonetaryGrant",
        "@id": `${pageUrl}#grant`,
        name: subsidy.title,
        url: pageUrl,
        description,
        text: detailText || description,
        funder: subsidy.workflow
          ? { "@type": "Organization", name: subsidy.workflow }
          : undefined,
        areaServed,
        audience: {
          "@type": "BusinessAudience",
          audienceType: subsidy.isForSME ? "中小企業・個人事業主" : "事業者",
        },
        applicationStartDate: subsidy.startDate ?? undefined,
        applicationDeadline: subsidy.endDate ?? undefined,
        amount: amount
          ? {
              "@type": "MonetaryAmount",
              currency: "JPY",
              value: amount,
            }
          : undefined,
        keywords: [
          ...subsidy.purposes,
          ...subsidy.industries,
          ...subsidy.prefectures,
        ].join(", "),
        sameAs: subsidy.referenceUrl ?? undefined,
      },
    ],
  }
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

  const ogImage = {
    url: absoluteUrl(DEFAULT_OG_IMAGE),
    width: 1200,
    height: 630,
    alt: subsidy.title,
  }

  const title = subsidyTitle(subsidy)

  return {
    title,
    description,
    alternates: {
      canonical: pageUrl,
    },
    ...(subsidy.status === "closed"
      ? { robots: { index: false, follow: true } }
      : {}),
    openGraph: {
      title: `${title} | ${SITE_NAME}`,
      description,
      url: pageUrl,
      type: "article",
      modifiedTime: subsidy.updatedAt,
      images: [ogImage],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | ${SITE_NAME}`,
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
  const relatedGroups = getRelatedGroups(subsidy)
  const faqItems = buildFaqItems(subsidy)
  const summary = buildSummary(subsidy)
  const localPrefecture = getLocalPrefecture(subsidy)
  const parentCrumb = localPrefecture
    ? { name: `${localPrefecture}の補助金`, path: `/subsidies/prefecture/${encodeURIComponent(localPrefecture)}/` }
    : { name: "補助金一覧", path: "/subsidies/" }
  const structuredData = buildSubsidyStructuredData(
    subsidy,
    pageUrl,
    description
  )

  const breadcrumbList = buildBreadcrumbList([
    { name: "ホーム", url: absoluteUrl("/") },
    { name: "補助金一覧", url: absoluteUrl("/subsidies/") },
    ...(localPrefecture ? [{ name: parentCrumb.name, url: absoluteUrl(parentCrumb.path) }] : []),
    { name: subsidy.title, url: pageUrl },
  ])

  const infoRows: { label: string; value: string | null }[] = [
    { label: "対象地域", value: areaLabel(subsidy) === "全国" ? "全国" : subsidy.prefectures.join("、") },
    {
      label: "対象者（従業員数）",
      value:
        subsidy.targetNumberOfEmployees ??
        (subsidy.employeeMin !== null || subsidy.employeeMax !== null
          ? `${subsidy.employeeMin ?? "—"}〜${subsidy.employeeMax ?? "—"}人`
          : null),
    },
    { label: "補助率", value: subsidy.subsidizedRate },
    {
      label: "補助上限額",
      value:
        subsidy.upperLimit === "0円"
          ? "情報なし"
          : formatAmount(subsidy.upperLimit),
    },
    { label: "補助下限額", value: formatAmount(subsidy.lowerLimit) },
    { label: "受付開始", value: formatDate(subsidy.startDate) },
    { label: "受付終了", value: formatDate(subsidy.endDate) },
    { label: "対象業種", value: industryLabel(subsidy) },
    {
      label: "利用目的",
      value: subsidy.usePurpose ?? (subsidy.purposes.length > 0 ? subsidy.purposes.map(purposeLabel).join("、") : null),
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
    { label: "最終更新日", value: formatDate(subsidy.updatedAt) },
  ]

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
          ...(localPrefecture ? [{ label: parentCrumb.name, href: parentCrumb.path }] : []),
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
          <span
            style={{
              color: "var(--text-muted)",
              fontSize: ".8rem",
              alignSelf: "center",
              marginLeft: "auto",
            }}
          >
            最終更新日：{formatDate(subsidy.updatedAt)}
          </span>
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

        <p
          style={{
            color: "var(--text-strong)",
            fontSize: ".92rem",
            lineHeight: 1.8,
            marginBottom: "1rem",
          }}
        >
          {summary}
        </p>

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
              <Link
                key={p}
                href={`/subsidies/purpose/${encodeURIComponent(p)}/`}
                style={{
                  textDecoration: "none",
                  backgroundColor: "var(--bg-tag)",
                  color: "#38b48b",
                  borderRadius: "4px",
                  padding: ".25rem .6rem",
                  fontSize: ".8rem",
                }}
              >
                {purposeLabel(p)}
              </Link>
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
              <Link
                key={ind}
                href={`/subsidies/industry/${encodeURIComponent(ind)}/`}
                style={{
                  textDecoration: "none",
                  backgroundColor: "var(--bg-surface-alt)",
                  color: "var(--text-base)",
                  borderRadius: "4px",
                  padding: ".25rem .6rem",
                  fontSize: ".8rem",
                }}
              >
                {ind}
              </Link>
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

      <FaqSection items={faqItems} />

      {relatedGroups.map((group) => (
        <section key={group.heading} style={{ marginBottom: "1.5rem" }}>
          <h2
            style={{
              color: "var(--text-base)",
              fontSize: ".85rem",
              fontWeight: "600",
              marginBottom: ".75rem",
            }}
          >
            {group.heading}
          </h2>
          <div style={{ display: "grid", gap: ".5rem" }}>
            {group.items.map((s) => (
              <Link
                key={s.slug}
                href={`/subsidies/${s.slug}/`}
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
                <span
                  style={{ color: "var(--text-strong)", fontSize: ".88rem" }}
                >
                  {s.title}
                </span>
              </Link>
            ))}
          </div>
          <Link
            href={group.href}
            style={{ display: "inline-block", marginTop: ".5rem", color: "#38b48b", fontSize: ".82rem", textDecoration: "none" }}
          >
            {group.linkLabel} →
          </Link>
        </section>
      ))}

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
