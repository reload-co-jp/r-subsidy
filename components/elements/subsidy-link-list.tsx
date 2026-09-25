import Link from "next/link"
import type { SubsidyIndexItem } from "../../lib/types"
import { formatAmount, formatDate } from "../../lib/format"
import { areaLabel } from "../../lib/seo"

// JSなしでも読めるサーバー描画の制度リスト（締切・受付状況ページ用）
export default function SubsidyLinkList({ items }: { items: SubsidyIndexItem[] }) {
  if (items.length === 0) {
    return <p style={{ color: "var(--text-muted)", fontSize: ".88rem" }}>該当する補助金はありません。</p>
  }
  return (
    <ul style={{ display: "grid", gap: ".5rem", listStyle: "none", padding: 0, margin: 0 }}>
      {items.map((s) => {
        const amount = s.upperLimit && s.upperLimit !== "0円" ? formatAmount(s.upperLimit) : null
        return (
          <li key={s.slug}>
            <Link
              href={`/subsidies/${s.slug}/`}
              style={{
                display: "block",
                backgroundColor: "var(--bg-surface)",
                border: "1px solid var(--border-soft)",
                borderRadius: "8px",
                padding: ".75rem 1rem",
                textDecoration: "none",
              }}
            >
              <span style={{ display: "block", color: "var(--text-strong)", fontSize: ".9rem" }}>{s.title}</span>
              <span style={{ display: "block", color: "var(--text-muted)", fontSize: ".78rem", marginTop: ".25rem" }}>
                {[
                  areaLabel(s),
                  amount && `上限${amount}`,
                  s.status === "upcoming"
                    ? s.startDate && `受付開始 ${formatDate(s.startDate)}`
                    : s.endDate && `締切 ${formatDate(s.endDate)}`,
                ]
                  .filter(Boolean)
                  .join(" ／ ")}
              </span>
            </Link>
          </li>
        )
      })}
    </ul>
  )
}
