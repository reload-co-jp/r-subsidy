export type FaqItem = { question: string; answer: string }

export function buildFaqStructuredData(items: FaqItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  }
}

export default function FaqSection({ items, title = "よくある質問" }: { items: FaqItem[]; title?: string }) {
  if (items.length === 0) return null

  return (
    <section className="card" style={{ padding: 0, marginBottom: "1.5rem", overflow: "hidden" }}>
      <h2 style={{ fontSize: "1rem", padding: ".85rem 1.25rem", borderBottom: "1px solid var(--border-soft)", background: "var(--bg-surface-alt)" }}>
        {title}
      </h2>
      <dl>
        {items.map((item, i) => (
          <div key={i} style={{ borderTop: i > 0 ? "1px solid var(--border-soft)" : undefined, padding: "1rem 1.25rem" }}>
            <dt style={{ color: "var(--navy)", fontSize: ".95rem", fontWeight: 700, marginBottom: ".35rem" }}>Q. {item.question}</dt>
            <dd style={{ color: "var(--text-base)", fontSize: ".9rem", margin: 0 }}>{item.answer}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}
