import type { Metadata } from "next"
import Link from "next/link"
import { Breadcrumb } from "../../../components/elements/breadcrumb"
import { RichMarkdown } from "../../../components/elements/rich-markdown"
import { formatDate } from "../../../lib/format"
import { loadGlossary } from "../../../lib/glossary"
import { SITE_NAME, absoluteUrl, buildBreadcrumbList } from "../../../lib/site"

type Props = { params: Promise<{ slug: string }> }

export const dynamicParams = false

export function generateStaticParams() {
  return loadGlossary().map((t) => ({ slug: t.slug }))
}

const getTerm = (slug: string) => loadGlossary().find((t) => t.slug === slug)

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const term = getTerm((await params).slug)
  if (!term) return {}
  const url = absoluteUrl(`/glossary/${term.slug}/`)
  const title = `${term.term}とは？意味と注意点をわかりやすく解説｜補助金用語集`
  return {
    title,
    description: term.summary,
    alternates: { canonical: url },
    openGraph: {
      title: `${title} | ${SITE_NAME}`,
      description: term.summary,
      url,
      type: "article",
    },
  }
}

export default async function GlossaryTermPage({ params }: Props) {
  const terms = loadGlossary()
  const { slug } = await params
  const term = terms.find((t) => t.slug === slug)
  if (!term) return null
  const url = absoluteUrl(`/glossary/${term.slug}/`)
  const related = term.related
    .map((s) => terms.find((t) => t.slug === s))
    .filter((t) => t !== undefined)
  const sameCategory = terms.filter(
    (t) =>
      t.category === term.category &&
      t.slug !== term.slug &&
      !term.related.includes(t.slug)
  )

  const structuredData = [
    {
      "@context": "https://schema.org",
      "@type": "DefinedTerm",
      name: term.term,
      alternateName: term.reading,
      description: term.summary,
      url,
      inLanguage: "ja",
      inDefinedTermSet: absoluteUrl("/glossary/#set"),
    },
    buildBreadcrumbList([
      { name: "ホーム", url: absoluteUrl("/") },
      { name: "補助金用語集", url: absoluteUrl("/glossary/") },
      { name: term.term, url },
    ]),
  ]

  return (
    <div className="page-content" style={{ maxWidth: "860px" }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <Breadcrumb
        items={[
          { label: "ホーム", href: "/" },
          { label: "補助金用語集", href: "/glossary/" },
          { label: term.term },
        ]}
      />
      <article>
        <p className="eyebrow">補助金用語集 ／ {term.category}</p>
        <h1 className="page-title">
          {term.term}
          <span
            style={{
              display: "block",
              color: "var(--text-muted)",
              fontSize: ".85rem",
              fontWeight: 400,
            }}
          >
            {term.reading}
          </span>
        </h1>
        <p
          className="note"
          style={{ margin: "1rem 0 1.75rem", fontSize: ".95rem" }}
        >
          <strong>{term.term}とは：</strong>
          {term.summary}
        </p>
        <div className="rich-html">
          <RichMarkdown>{term.body}</RichMarkdown>
        </div>
        <p
          style={{
            color: "var(--text-muted)",
            fontSize: ".8rem",
            marginTop: "1.5rem",
          }}
        >
          この解説は当サイト独自の一般的な説明です（更新日：
          {formatDate(term.updatedAt)}
          ）。制度ごとの正式な定義・要件は、各制度の公募要領・公式窓口で確認してください。
        </p>
      </article>

      {related.length > 0 && (
        <section style={{ marginTop: "2.5rem" }}>
          <h2 className="sub-title">関連する用語</h2>
          <ul className="list-plain grid grid-2">
            {related.map((t) => (
              <li key={t.slug}>
                <Link
                  href={`/glossary/${t.slug}/`}
                  className="card card-link"
                  style={{ height: "100%", padding: "1rem" }}
                >
                  <p className="card-title" style={{ fontSize: ".95rem" }}>
                    {t.term}
                  </p>
                  <p className="card-text">{t.summary}</p>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {term.links.length > 0 && (
        <section style={{ marginTop: "2rem" }}>
          <h2 className="sub-title">あわせて読みたいページ</h2>
          <ul className="list-plain chip-group">
            {term.links.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="chip">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {sameCategory.length > 0 && (
        <section style={{ marginTop: "2rem" }}>
          <h2 className="sub-title">「{term.category}」のほかの用語</h2>
          <ul className="list-plain chip-group">
            {sameCategory.map((t) => (
              <li key={t.slug}>
                <Link href={`/glossary/${t.slug}/`} className="chip">
                  {t.term}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <p style={{ marginTop: "2.5rem" }}>
        <Link href="/glossary/" className="link-more">
          ← 補助金用語集の一覧へ
        </Link>
      </p>
    </div>
  )
}
