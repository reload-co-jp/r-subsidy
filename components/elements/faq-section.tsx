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

export default function FaqSection({ items }: { items: FaqItem[] }) {
  if (items.length === 0) return null

  return (
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
      {items.map((item, i) => (
        <div
          key={i}
          style={{
            borderBottom: i < items.length - 1 ? "1px solid var(--border-strong)" : undefined,
            padding: ".85rem 1rem",
          }}
        >
          <p
            style={{
              color: "#38b48b",
              fontSize: ".82rem",
              fontWeight: "bold",
              marginBottom: ".35rem",
            }}
          >
            Q. {item.question}
          </p>
          <p style={{ color: "var(--text-strong)", fontSize: ".88rem", margin: 0 }}>
            A. {item.answer}
          </p>
        </div>
      ))}
    </div>
  )
}
