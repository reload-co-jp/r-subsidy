import type { ReactNode } from "react"
import Link from "next/link"
import type { Status } from "../../lib/types"
import { areaLabel, formatAmount, formatDate } from "../../lib/format"
import PurposeTagLink from "./purpose-tag-link"
import StatusBadge from "./status-badge"

export default function SubsidyCard({
  slug,
  title,
  status,
  region,
  prefectures,
  upperLimit,
  endDate,
  purposes = [],
  maxPurposes = 4,
  overview,
  period,
  updatedAt,
  accentColor,
  trailing,
}: {
  slug: string
  title: string
  status?: Status
  region?: string
  prefectures?: string[]
  upperLimit?: string | null
  endDate?: string | null
  purposes?: string[]
  maxPurposes?: number
  overview?: string | null
  period?: string | null
  updatedAt?: string | null
  accentColor?: string
  trailing?: ReactNode
}) {
  const amount = upperLimit && upperLimit !== "0円" ? formatAmount(upperLimit) : null
  const visiblePurposes = purposes.slice(0, maxPurposes)

  return (
    <Link
      href={`/subsidies/${slug}/`}
      className="card card-link"
      style={{
        display: "flex",
        gap: "1rem",
        alignItems: "center",
        borderLeft: accentColor ? `4px solid ${accentColor}` : undefined,
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        {(status || region) && (
          <div className="card-meta">
            {status && <StatusBadge status={status} />}
            {region && <span className="badge badge-navy">{areaLabel({ region, prefectures: prefectures ?? [] })}</span>}
          </div>
        )}
        <h3 className="card-title">{title}</h3>
        {overview && <p className="card-text">{overview}</p>}
        <dl className="card-facts">
          {status !== "upcoming" && endDate !== undefined && (
            <div>
              <dt>締切</dt>
              <dd>{formatDate(endDate) ?? <span className="unconfirmed">未確認</span>}</dd>
            </div>
          )}
          {upperLimit !== undefined && (
            <div>
              <dt>補助上限</dt>
              <dd>{amount ?? <span className="unconfirmed">未確認</span>}</dd>
            </div>
          )}
          {period && (
            <div>
              <dt>受付期間</dt>
              <dd style={{ fontWeight: 400 }}>{period}</dd>
            </div>
          )}
          {updatedAt && (
            <div>
              <dt>更新</dt>
              <dd style={{ fontWeight: 400 }}>{formatDate(updatedAt)}</dd>
            </div>
          )}
        </dl>
        {visiblePurposes.length > 0 && (
          <div className="chip-group" style={{ gap: ".35rem", marginTop: ".6rem" }}>
            {visiblePurposes.map((p) => (
              <PurposeTagLink key={p} purpose={p} />
            ))}
          </div>
        )}
      </div>
      {trailing && <div style={{ textAlign: "right", flexShrink: 0 }}>{trailing}</div>}
    </Link>
  )
}
