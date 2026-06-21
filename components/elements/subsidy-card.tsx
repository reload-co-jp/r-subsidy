import type { ReactNode } from "react"
import Link from "next/link"
import { formatAmount } from "../../lib/format"
import PurposeTagLink from "./purpose-tag-link"

export type SubsidyCardBadge = { label: string; color: string }

export default function SubsidyCard({
  slug,
  title,
  upperLimit,
  purposes = [],
  maxPurposes = 4,
  badges = [],
  overview,
  period,
  accentColor,
  trailing,
}: {
  slug: string
  title: string
  upperLimit?: string | null
  purposes?: string[]
  maxPurposes?: number
  badges?: SubsidyCardBadge[]
  overview?: string | null
  period?: string | null
  accentColor?: string
  trailing?: ReactNode
}) {
  const hasUpperLimit = !!upperLimit && upperLimit !== "0円"
  const visiblePurposes = purposes.slice(0, maxPurposes)

  return (
    <Link href={`/subsidies/${slug}`} style={{ textDecoration: "none" }}>
      <div
        style={{
          backgroundColor: "var(--bg-surface)",
          borderRadius: "8px",
          padding: trailing ? "1rem 1.25rem" : "1.25rem",
          border: `1px solid ${accentColor ? `${accentColor}33` : "var(--border-soft)"}`,
          transition: "border-color .15s",
          cursor: "pointer",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "1rem",
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: ".75rem",
              flexWrap: "wrap",
            }}
          >
            {badges.map((b) => (
              <span
                key={b.label}
                style={{
                  backgroundColor: b.color + "22",
                  color: b.color,
                  border: `1px solid ${b.color}44`,
                  borderRadius: "4px",
                  padding: ".15rem .5rem",
                  fontSize: ".75rem",
                  whiteSpace: "nowrap",
                  flexShrink: 0,
                }}
              >
                {b.label}
              </span>
            ))}
            <h2
              style={{
                color: "var(--text-strong)",
                fontSize: ".95rem",
                fontWeight: "bold",
                margin: 0,
                flex: 1,
                minWidth: "200px",
              }}
            >
              {title}
            </h2>
          </div>
          {overview && (
            <p
              style={{
                color: "var(--text-muted)",
                fontSize: ".8rem",
                marginTop: ".5rem",
                lineHeight: 1.6,
                overflow: "hidden",
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
              }}
            >
              {overview}
            </p>
          )}
          {(visiblePurposes.length > 0 || hasUpperLimit) && (
            <div
              style={{
                marginTop: ".75rem",
                display: "flex",
                gap: ".5rem",
                flexWrap: "wrap",
                alignItems: "center",
              }}
            >
              {visiblePurposes.map((p) => (
                <PurposeTagLink key={p} purpose={p} />
              ))}
              {hasUpperLimit && (
                <span
                  style={{
                    marginLeft: visiblePurposes.length > 0 ? "auto" : 0,
                    color: "#f59e0b",
                    fontSize: ".8rem",
                    whiteSpace: "nowrap",
                  }}
                >
                  上限 {formatAmount(upperLimit ?? null)}
                </span>
              )}
            </div>
          )}
          {period && (
            <p
              style={{
                color: "var(--text-muted)",
                fontSize: ".8rem",
                marginTop: ".55rem",
              }}
            >
              受付期間 {period}
            </p>
          )}
        </div>
        {trailing && (
          <div style={{ textAlign: "right", flexShrink: 0 }}>{trailing}</div>
        )}
      </div>
    </Link>
  )
}
