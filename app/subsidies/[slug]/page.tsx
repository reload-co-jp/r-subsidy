import { FIELD_GLOSSARY } from "../../../lib/glossary"
import { FC } from "react"
import Link from "next/link"
import { Breadcrumb } from "../../../components/elements/breadcrumb"
import FaqSection, {
  buildFaqStructuredData,
} from "../../../components/elements/faq-section"
import StatusBadge, {
  STATUS_LABEL,
} from "../../../components/elements/status-badge"
import SubsidyLinkList from "../../../components/elements/subsidy-link-list"
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
import { formatDate, formatAmount, isIndexableSubsidy } from "../../../lib/format"
import { isPrefecture } from "../../../lib/prefectures"
import {
  areaLabel,
  isActive,
  isLocalTo,
  loadSubsidyIndex,
  loadUpdateHistory,
  purposeLabel,
  toJstDate,
  subsidyTitle,
} from "../../../lib/seo"

type RelatedGroup = {
  heading: string
  href: string
  linkLabel: string
  items: SubsidyIndexItem[]
}

// 業種がほぼ全業種指定の制度は「業種を問わない」扱い
const ALL_INDUSTRY_THRESHOLD = 30

function industryLabel(subsidy: NormalizedSubsidy) {
  if (subsidy.industries.length === 0) return null
  if (subsidy.industries.length >= ALL_INDUSTRY_THRESHOLD)
    return "業種を問わず幅広い業種が対象"
  return subsidy.industries.join("、")
}

function getLocalPrefecture(subsidy: NormalizedSubsidy) {
  return subsidy.region !== "national"
    ? (subsidy.prefectures.find(isPrefecture) ?? null)
    : null
}

function getRelatedGroups(subsidy: NormalizedSubsidy): RelatedGroup[] {
  const active = loadSubsidyIndex().filter(
    (s) => s.slug !== subsidy.slug && isActive(s)
  )
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
  const industry =
    subsidy.industries.length < ALL_INDUSTRY_THRESHOLD
      ? subsidy.industries[0]
      : undefined
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
      active.filter(
        (s) =>
          areaLabel(s) === "全国" &&
          s.purposes.some((p) => subsidy.purposes.includes(p))
      )
    ),
  })
  return groups.filter((g) => g.items.length > 0)
}

type FaqItem = { question: string; answer: string }

// 制度データから事実として回答できる質問のみ生成する
function buildFaqItems(subsidy: NormalizedSubsidy): FaqItem[] {
  const items: FaqItem[] = []
  const name = subsidy.title

  items.push({
    question: `${name}の対象地域は?`,
    answer:
      areaLabel(subsidy) === "全国"
        ? "全国が対象です。"
        : `${subsidy.prefectures.join("、")}が対象です。`,
  })

  if (subsidy.subsidizedRate) {
    items.push({
      question: `${name}の補助率はいくら?`,
      answer: subsidy.subsidizedRate,
    })
  }

  if (subsidy.upperLimit && subsidy.upperLimit !== "0円") {
    items.push({
      question: `${name}の補助上限額はいくら?`,
      answer: formatAmount(subsidy.upperLimit) ?? subsidy.upperLimit,
    })
  }

  if (subsidy.startDate || subsidy.endDate) {
    const start = subsidy.startDate ? formatDate(subsidy.startDate) : "未確認"
    const end = subsidy.endDate ? formatDate(subsidy.endDate) : "未確認"
    items.push({
      question: `${name}の受付期間は?`,
      answer: `${start} 〜 ${end}（${STATUS_LABEL[subsidy.status] ?? "要確認"}）`,
    })
  }

  const industries = industryLabel(subsidy)
  if (industries) {
    items.push({ question: `${name}の対象業種は?`, answer: industries })
  }

  if (subsidy.targetNumberOfEmployees) {
    items.push({
      question: `${name}の従業員数の条件は?`,
      answer: subsidy.targetNumberOfEmployees,
    })
  }

  if (subsidy.purposes.includes("デジタル化")) {
    items.push({
      question: `${name}はIT導入・DXに利用できる?`,
      answer:
        "対象用途に「デジタル化（IT・DX）」が含まれます。対象経費の詳細は公式情報をご確認ください。",
    })
  }

  if (subsidy.purposes.includes("設備投資")) {
    items.push({
      question: `${name}は設備投資に利用できる?`,
      answer:
        "対象用途に「設備投資」が含まれます。対象経費の詳細は公式情報をご確認ください。",
    })
  }

  if (subsidy.workflow) {
    items.push({ question: `${name}の申請窓口は?`, answer: subsidy.workflow })
  }

  return items
}

// ページ冒頭の2〜3文の概要（制度データのみから生成）
function buildSummary(subsidy: NormalizedSubsidy) {
  const area = areaLabel(subsidy)
  const sentences = [
    `${subsidy.title}は、${area === "全国" ? "全国" : area}の事業者を対象とした補助金・助成金です。`,
  ]
  const amount =
    subsidy.upperLimit && subsidy.upperLimit !== "0円"
      ? formatAmount(subsidy.upperLimit)
      : null
  const rate =
    subsidy.subsidizedRate && subsidy.subsidizedRate.length <= 40
      ? subsidy.subsidizedRate
      : null
  if (amount || rate) {
    sentences.push(
      [amount && `補助上限額は${amount}`, rate && `補助率は${rate}`]
        .filter(Boolean)
        .join("、") + "です。"
    )
  }
  if (subsidy.startDate || subsidy.endDate) {
    sentences.push(
      `受付期間は${formatDate(subsidy.startDate) ?? "未確認"}〜${formatDate(subsidy.endDate) ?? "未確認"}で、現在は「${STATUS_LABEL[subsidy.status] ?? "要確認"}」です。`
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
    const purposes =
      subsidy.purposes.length > 0
        ? `対象用途は${subsidy.purposes.map(purposeLabel).join("・")}。`
        : ""
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

// 公開元の入力テンプレート文が残っている制度があるため、未記載として表示する
const TEMPLATE_PLACEHOLDER = /（ここに[^）]*入力して(?:下|くだ)さい。?）/g

function sanitizeDetailHtml(raw: string) {
  const html = raw.replace(TEMPLATE_PLACEHOLDER, "（公開情報に記載なし）")
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
        : areaLabel(subsidy)
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
    ...(!isIndexableSubsidy(subsidy)
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

const SOURCE_LABEL: Record<string, string> = {
  jgrants: "Jグランツ（デジタル庁）",
  tokyo: "東京都中小企業振興公社",
  national: "国の公開情報",
  jnet21: "J-Net21 支援情報ヘッドライン（中小機構）",
  mhlw: "厚生労働省（雇用関係助成金）",
  manual: "公的機関の公開情報（運営者が個別に登録）",
}

const UNCONFIRMED = "未確認（公募要領でご確認ください）"

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
            color: "var(--green-dark)",
            textDecoration: "none",
            fontSize: ".875rem",
          }}
        >
          ← 補助金一覧に戻る
        </Link>
      </div>
    )
  }

  const history = loadUpdateHistory()
  const pageUrl = absoluteUrl(`/subsidies/${subsidy.slug}/`)
  const description = buildDescription(subsidy)
  const relatedGroups = getRelatedGroups(subsidy)
  const faqItems = buildFaqItems(subsidy)
  const summary = buildSummary(subsidy)
  const localPrefecture = getLocalPrefecture(subsidy)
  const parentCrumb = localPrefecture
    ? {
        name: `${localPrefecture}の補助金`,
        path: `/subsidies/prefecture/${encodeURIComponent(localPrefecture)}/`,
      }
    : { name: "補助金一覧", path: "/subsidies/" }
  const structuredData = buildSubsidyStructuredData(
    subsidy,
    pageUrl,
    description
  )

  const breadcrumbList = buildBreadcrumbList([
    { name: "ホーム", url: absoluteUrl("/") },
    { name: "補助金一覧", url: absoluteUrl("/subsidies/") },
    ...(localPrefecture
      ? [{ name: parentCrumb.name, url: absoluteUrl(parentCrumb.path) }]
      : []),
    { name: subsidy.title, url: pageUrl },
  ])

  const amount =
    subsidy.upperLimit && subsidy.upperLimit !== "0円"
      ? formatAmount(subsidy.upperLimit)
      : null
  const period =
    subsidy.startDate || subsidy.endDate
      ? `${formatDate(subsidy.startDate) ?? "未確認"} 〜 ${formatDate(subsidy.endDate) ?? "未確認"}`
      : null
  const employees =
    subsidy.targetNumberOfEmployees ??
    (subsidy.employeeMin !== null || subsidy.employeeMax !== null
      ? `${subsidy.employeeMin ?? "—"}〜${subsidy.employeeMax ?? "—"}人`
      : null)

  const keyFacts: { label: string; value: React.ReactNode }[] = [
    { label: "受付状態", value: <StatusBadge status={subsidy.status} /> },
    {
      label: "対象地域",
      value:
        areaLabel(subsidy) === "全国" ? "全国" : subsidy.prefectures.join("、"),
    },
    { label: "申請期間", value: period },
    { label: "補助上限額", value: amount },
    { label: "補助率", value: subsidy.subsidizedRate },
  ]

  const targetRows: { label: string; value: string | null }[] = [
    { label: "対象者（従業員数）", value: employees },
    {
      label: "中小企業向け",
      value: subsidy.isForSME
        ? "中小企業・小規模事業者が対象に含まれます"
        : null,
    },
    { label: "対象業種", value: industryLabel(subsidy) },
    {
      label: "利用目的",
      value:
        subsidy.usePurpose ??
        (subsidy.purposes.length > 0
          ? subsidy.purposes.map(purposeLabel).join("、")
          : null),
    },
    { label: "補助下限額", value: formatAmount(subsidy.lowerLimit) },
    { label: "申請窓口", value: subsidy.workflow },
  ]

  const fieldLabel = (label: string) =>
    FIELD_GLOSSARY[label] ? (
      <Link
        href={`/glossary/${FIELD_GLOSSARY[label]}/`}
        title={`用語解説：${label}`}
      >
        {label}
      </Link>
    ) : (
      label
    )
  const show = (v: React.ReactNode) =>
    v ?? <span className="unconfirmed">{UNCONFIRMED}</span>

  return (
    <div className="page-content" style={{ maxWidth: "960px" }}>
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
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(buildFaqStructuredData(faqItems)),
          }}
        />
      )}
      <Breadcrumb
        items={[
          { label: "ホーム", href: "/" },
          { label: "補助金一覧", href: "/subsidies/" },
          ...(localPrefecture
            ? [{ label: parentCrumb.name, href: parentCrumb.path }]
            : []),
          { label: subsidy.title },
        ]}
      />

      <header style={{ marginBottom: "1.5rem" }}>
        <div className="card-meta">
          <StatusBadge status={subsidy.status} />
          <span className="badge badge-navy">{areaLabel(subsidy)}</span>
          {subsidy.isForSME && <span className="badge">中小企業向け</span>}
        </div>
        <h1 className="page-title">{subsidy.title}</h1>
        <p style={{ fontSize: ".95rem" }}>{summary}</p>
        {subsidy.status === "closed" && (
          <p
            className="note"
            style={{ marginTop: "1rem", borderLeftColor: "#6b7280" }}
          >
            この制度は受付を終了しています（データ取得時点）。次回の公募予定は公式情報をご確認ください。
          </p>
        )}
      </header>

      <section
        aria-labelledby="key-facts"
        className="card"
        style={{ padding: 0, overflow: "hidden", marginBottom: "1.5rem" }}
      >
        <h2 id="key-facts" className="visually-hidden">
          制度の要点
        </h2>
        <table className="data-table">
          <tbody>
            {keyFacts.map((row) => (
              <tr key={row.label}>
                <th scope="row">{fieldLabel(row.label)}</th>
                <td style={{ fontWeight: 700, color: "var(--text-strong)" }}>
                  {show(row.value)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {subsidy.referenceUrl && (
        <div
          className="card"
          style={{
            marginBottom: "2rem",
            display: "flex",
            flexWrap: "wrap",
            gap: "1rem",
            alignItems: "center",
            justifyContent: "space-between",
            background: "var(--navy-50)",
            borderColor: "#c9d4e3",
          }}
        >
          <p style={{ fontSize: ".9rem", flex: "1 1 280px" }}>
            公募要領・申請方法・必要書類は公式ページで確認できます。申請前に必ず最新の公式情報をご確認ください。
          </p>
          <a
            href={subsidy.referenceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-primary"
          >
            公式ページ（公募要領・申請窓口）を開く
            <span className="visually-hidden">（新しいタブで開きます）</span>
          </a>
        </div>
      )}

      {subsidy.overview && (
        <section style={{ marginBottom: "2rem" }}>
          <h2 style={{ fontSize: "1.2rem", marginBottom: ".75rem" }}>
            制度の概要
          </h2>
          <p style={{ fontSize: ".95rem", lineHeight: 1.9 }}>
            {subsidy.overview}
          </p>
        </section>
      )}

      <section style={{ marginBottom: "2rem" }}>
        <h2 style={{ fontSize: "1.2rem", marginBottom: ".75rem" }}>
          対象者・利用条件
        </h2>
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <table className="data-table">
            <tbody>
              {targetRows.map((row) => (
                <tr key={row.label}>
                  <th scope="row">{fieldLabel(row.label)}</th>
                  <td>{show(row.value)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {(subsidy.purposes.length > 0 || subsidy.industries.length > 0) && (
          <div className="chip-group" style={{ marginTop: "1rem" }}>
            {subsidy.purposes.map((p) => (
              <Link
                key={p}
                href={`/subsidies/purpose/${encodeURIComponent(p)}/`}
                className="chip"
              >
                {purposeLabel(p)}の補助金
              </Link>
            ))}
            {subsidy.industries.length < ALL_INDUSTRY_THRESHOLD &&
              subsidy.industries.map((ind) => (
                <Link
                  key={ind}
                  href={`/subsidies/industry/${encodeURIComponent(ind)}/`}
                  className="chip"
                >
                  {ind}の補助金
                </Link>
              ))}
          </div>
        )}
      </section>

      {lawyerComment && (
        <section
          className="note"
          style={{ marginBottom: "2rem", borderLeftColor: "var(--green)" }}
        >
          <h2 style={{ fontSize: ".95rem", marginBottom: ".4rem" }}>
            行政書士コメント（サイト独自の解説）
          </h2>
          <p>{lawyerComment}</p>
        </section>
      )}

      <section style={{ marginBottom: "2rem" }}>
        <h2 style={{ fontSize: "1.2rem", marginBottom: ".35rem" }}>
          対象経費・申請方法・必要書類
        </h2>
        <p
          style={{
            color: "var(--text-muted)",
            fontSize: ".85rem",
            marginBottom: ".75rem",
          }}
        >
          以下は{SOURCE_LABEL[subsidy.source] ?? "公的機関"}
          が公開している制度情報です。対象経費・申請方法・必要書類が記載されていない場合は、公式ページの公募要領をご確認ください。
        </p>
        {subsidy.detail ? (
          <div
            className="card rich-html"
            dangerouslySetInnerHTML={{
              __html: sanitizeDetailHtml(subsidy.detail),
            }}
          />
        ) : (
          <p className="card unconfirmed">
            公開情報に詳細の記載がありません。{UNCONFIRMED}
          </p>
        )}
      </section>

      <FaqSection items={faqItems} title={`${subsidy.title}のよくある質問`} />

      <section
        className="note"
        style={{ marginBottom: "2rem" }}
        aria-label="データの出典"
      >
        <p>
          <strong>出典：</strong>
          {SOURCE_LABEL[subsidy.source] ?? "公的機関の公開情報"}
          {subsidy.referenceUrl && (
            <>
              （
              <a
                href={subsidy.referenceUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                公式ページ
              </a>
              ）
            </>
          )}
        </p>
        <p>
          <strong>制度情報の更新日：</strong>
          {formatDate(subsidy.updatedAt) ?? "未確認"}
          {history && (
            <>
              ／<strong>当サイトの最終確認日：</strong>
              {formatDate(toJstDate(history.lastUpdated))}
            </>
          )}
        </p>
        <p>
          受付状態は取得時点の受付期間から判定しています。予算到達による早期終了や期間変更がありうるため、申請前に公式情報をご確認ください。本ページの情報は採択・受給を保証するものではありません。
          <Link href="/about/">データの取得方法について</Link>
        </p>
      </section>

      {relatedGroups.map((group) => (
        <section key={group.heading} style={{ marginBottom: "2rem" }}>
          <div className="section-head" style={{ marginBottom: ".75rem" }}>
            <h2 style={{ fontSize: "1.1rem" }}>{group.heading}</h2>
            <Link href={group.href} className="link-more">
              {group.linkLabel} →
            </Link>
          </div>
          <SubsidyLinkList items={group.items} />
        </section>
      ))}

      <div
        className="card"
        style={{ textAlign: "center", background: "var(--bg-surface-alt)" }}
      >
        <p style={{ marginBottom: ".75rem" }}>
          ほかに使える補助金がないか、条件から探せます。
        </p>
        <Link href="/diagnosis/" className="btn btn-navy">
          補助金診断で探す
        </Link>
      </div>
    </div>
  )
}

export default Page
