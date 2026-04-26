"use client"

import { useState } from "react"

type ApplicationCase = {
  id: string
  subsidyName: string
  industry: string
  companyType: string
  region: string
  challenge: string
  solution: string
  result: string
  sourceLabel: string
  sourceUrl: string
}

export default function CasesListClient({
  cases,
  subsidyNames,
}: {
  cases: ApplicationCase[]
  subsidyNames: string[]
}) {
  const [filter, setFilter] = useState("all")

  const filtered = filter === "all" ? cases : cases.filter((c) => c.subsidyName === filter)

  return (
    <>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: ".5rem",
          marginBottom: "1.25rem",
        }}
      >
        {["all", ...subsidyNames].map((name) => {
          const selected = filter === name
          return (
            <button
              key={name}
              type="button"
              onClick={() => setFilter(name)}
              style={{
                borderRadius: "999px",
                border: `1px solid ${selected ? "#38b48b" : "var(--border-soft)"}`,
                backgroundColor: selected ? "#38b48b22" : "var(--bg-surface-alt)",
                color: selected ? "#38b48b" : "var(--text-base)",
                padding: ".45rem .8rem",
                fontSize: ".8rem",
                cursor: "pointer",
              }}
            >
              {name === "all" ? "すべて" : name}
            </button>
          )
        })}
      </div>

      <div style={{ display: "grid", gap: "1rem" }}>
        {filtered.map((c) => (
          <article
            key={c.id}
            style={{
              backgroundColor: "var(--bg-surface)",
              border: "1px solid var(--border-soft)",
              borderRadius: "10px",
              padding: "1.25rem 1.5rem",
            }}
          >
            <div
              style={{
                display: "flex",
                gap: ".5rem",
                flexWrap: "wrap",
                marginBottom: ".75rem",
              }}
            >
              <span
                style={{
                  backgroundColor: "#38b48b22",
                  color: "#38b48b",
                  border: "1px solid #38b48b44",
                  borderRadius: "4px",
                  padding: ".2rem .6rem",
                  fontSize: ".75rem",
                  fontWeight: "bold",
                }}
              >
                {c.subsidyName}
              </span>
              <span
                style={{
                  backgroundColor: "var(--bg-surface-alt)",
                  color: "var(--text-muted)",
                  borderRadius: "4px",
                  padding: ".2rem .6rem",
                  fontSize: ".75rem",
                }}
              >
                {c.industry}
              </span>
              <span
                style={{
                  backgroundColor: "var(--bg-surface-alt)",
                  color: "var(--text-muted)",
                  borderRadius: "4px",
                  padding: ".2rem .6rem",
                  fontSize: ".75rem",
                }}
              >
                {c.companyType}
              </span>
              {c.region !== "全国" && (
                <span
                  style={{
                    backgroundColor: "var(--bg-surface-alt)",
                    color: "var(--text-muted)",
                    borderRadius: "4px",
                    padding: ".2rem .6rem",
                    fontSize: ".75rem",
                  }}
                >
                  {c.region}
                </span>
              )}
            </div>

            <dl style={{ display: "grid", gap: ".65rem" }}>
              <div style={{ display: "grid", gridTemplateColumns: "5rem 1fr", gap: ".5rem" }}>
                <dt style={{ color: "var(--text-muted)", fontSize: ".78rem", paddingTop: ".1rem" }}>
                  課題
                </dt>
                <dd style={{ color: "var(--text-base)", fontSize: ".875rem", lineHeight: 1.7 }}>
                  {c.challenge}
                </dd>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "5rem 1fr", gap: ".5rem" }}>
                <dt style={{ color: "var(--text-muted)", fontSize: ".78rem", paddingTop: ".1rem" }}>
                  取り組み
                </dt>
                <dd style={{ color: "var(--text-base)", fontSize: ".875rem", lineHeight: 1.7 }}>
                  {c.solution}
                </dd>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "5rem 1fr", gap: ".5rem" }}>
                <dt style={{ color: "var(--text-muted)", fontSize: ".78rem", paddingTop: ".1rem" }}>
                  効果
                </dt>
                <dd
                  style={{
                    color: "var(--text-strong)",
                    fontSize: ".875rem",
                    lineHeight: 1.7,
                    fontWeight: "500",
                  }}
                >
                  {c.result}
                </dd>
              </div>
            </dl>

            <div
              style={{
                marginTop: ".85rem",
                borderTop: "1px solid var(--border-soft)",
                paddingTop: ".65rem",
              }}
            >
              <a
                href={c.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: "var(--text-muted)", fontSize: ".75rem", textDecoration: "none" }}
              >
                出典: {c.sourceLabel} ↗
              </a>
            </div>
          </article>
        ))}
      </div>
    </>
  )
}
