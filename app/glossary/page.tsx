import type { Metadata } from "next"
import Link from "next/link"
import { Breadcrumb } from "../../components/elements/breadcrumb"
import { GLOSSARY_CATEGORIES, loadGlossary } from "../../lib/glossary"
import { SITE_NAME, absoluteUrl, buildBreadcrumbList } from "../../lib/site"

const PAGE_URL = absoluteUrl("/glossary/")
const TITLE =
  "補助金用語集｜公募要領・補助率・交付決定などの意味をわかりやすく解説"
const DESCRIPTION =
  "補助金・助成金の申請で使われる用語の意味を解説する用語集です。公募要領、補助率、補助上限額、採択、交付決定、実績報告、GビズID、中小企業者の定義など、申請前に知っておきたい用語をまとめています。"

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: PAGE_URL },
  openGraph: {
    title: `${TITLE} | ${SITE_NAME}`,
    description: DESCRIPTION,
    url: PAGE_URL,
    type: "website",
  },
}

export default function GlossaryPage() {
  const terms = loadGlossary()
  const structuredData = [
    {
      "@context": "https://schema.org",
      "@type": "DefinedTermSet",
      "@id": `${PAGE_URL}#set`,
      name: "補助金用語集",
      url: PAGE_URL,
      inLanguage: "ja",
      hasDefinedTerm: terms.map((t) => ({
        "@type": "DefinedTerm",
        name: t.term,
        url: absoluteUrl(`/glossary/${t.slug}/`),
      })),
    },
    buildBreadcrumbList([
      { name: "ホーム", url: absoluteUrl("/") },
      { name: "補助金用語集", url: PAGE_URL },
    ]),
  ]

  return (
    <div className="page-content">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <Breadcrumb
        items={[{ label: "ホーム", href: "/" }, { label: "補助金用語集" }]}
      />
      <h1 className="page-title">補助金用語集</h1>
      <p className="page-lead" style={{ marginBottom: "1rem" }}>
        補助金・助成金の公募要領や申請手続きで使われる用語を、申請の流れに沿って解説しています。制度ごとの正式な定義は、各制度の公募要領を確認してください。
      </p>
      <nav
        aria-label="分類で移動"
        className="chip-group"
        style={{ marginBottom: "2rem" }}
      >
        {GLOSSARY_CATEGORIES.map((c) => (
          <a key={c} href={`#${encodeURIComponent(c)}`} className="chip">
            {c}
          </a>
        ))}
      </nav>
      {GLOSSARY_CATEGORIES.map((category) => {
        const items = terms.filter((t) => t.category === category)
        if (items.length === 0) return null
        return (
          <section
            key={category}
            id={encodeURIComponent(category)}
            style={{ marginBottom: "2.5rem", scrollMarginTop: "80px" }}
          >
            <h2 className="section-title" style={{ marginBottom: "1rem" }}>
              {category}
            </h2>
            <ul className="list-plain grid grid-2">
              {items.map((t) => (
                <li key={t.slug}>
                  <Link
                    href={`/glossary/${t.slug}/`}
                    className="card card-link"
                    style={{ height: "100%" }}
                  >
                    <p className="card-title">{t.term}</p>
                    <p
                      style={{ color: "var(--text-muted)", fontSize: ".75rem" }}
                    >
                      {t.reading}
                    </p>
                    <p className="card-text" style={{ WebkitLineClamp: 3 }}>
                      {t.summary}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )
      })}
    </div>
  )
}
