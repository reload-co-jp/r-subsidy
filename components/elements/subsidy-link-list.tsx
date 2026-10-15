import Link from "next/link"
import type { SubsidyIndexItem } from "../../lib/types"
import { areaLabel, formatAmount, formatDate } from "../../lib/format"
import StatusBadge from "./status-badge"

// JSなしでも読めるサーバー描画の制度リスト（締切・受付状況ページ用）
export default function SubsidyLinkList({ items }: { items: SubsidyIndexItem[] }) {
  if (items.length === 0) {
    return <p className="section-lead">該当する補助金はありません。</p>
  }
  return (
    <ul className="list-plain grid" style={{ gap: ".5rem" }}>
      {items.map((s) => {
        const amount = s.upperLimit && s.upperLimit !== "0円" ? formatAmount(s.upperLimit) : null
        return (
          <li key={s.slug}>
            <Link href={`/subsidies/${s.slug}/`} className="card card-link" style={{ padding: ".85rem 1rem" }}>
              <span className="card-meta" style={{ marginBottom: ".3rem" }}>
                <StatusBadge status={s.status} />
              </span>
              <span className="card-title" style={{ display: "block", fontSize: ".95rem" }}>{s.title}</span>
              <span style={{ display: "block", color: "var(--text-muted)", fontSize: ".82rem", marginTop: ".25rem" }}>
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
