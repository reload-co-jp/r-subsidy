"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import type { SubsidyIndexItem } from "../../lib/types"

const statusLabel: Record<string, { label: string; color: string }> = {
  open: { label: "受付中", color: "#22c55e" },
  upcoming: { label: "公募前", color: "#f59e0b" },
  closed: { label: "終了", color: "#6b7280" },
  unknown: { label: "要確認", color: "#94a3b8" },
}

const regionLabel: Record<string, string> = {
  national: "全国",
  tokyo: "東京都",
  prefecture: "都道府県",
}

function normalizeText(value: string) {
  return value.toLowerCase().replace(/\s+/g, "")
}

function buildSearchIndex(subsidy: SubsidyIndexItem) {
  const st = statusLabel[subsidy.status] ?? statusLabel.unknown
  const region = regionLabel[subsidy.region] ?? subsidy.region

  return normalizeText(
    [
      subsidy.title,
      region,
      st.label,
      ...subsidy.purposes,
      ...subsidy.industries,
      subsidy.upperLimit ?? "",
    ].join(" ")
  )
}

export default function SubsidiesListClient({
  subsidies,
}: {
  subsidies: SubsidyIndexItem[]
}) {
  const [query, setQuery] = useState("")

  const filtered = useMemo(() => {
    const normalizedQuery = normalizeText(query)
    if (!normalizedQuery) return subsidies

    return subsidies.filter((subsidy) =>
      buildSearchIndex(subsidy).includes(normalizedQuery)
    )
  }, [query, subsidies])

  if (subsidies.length === 0) {
    return (
      <div
        style={{
          backgroundColor: "var(--bg-surface)",
          borderRadius: "8px",
          padding: "3rem",
          textAlign: "center",
          color: "var(--text-muted)",
        }}
      >
        <p style={{ marginBottom: "1rem" }}>補助金データがありません</p>
        <code
          style={{
            backgroundColor: "#0d1117",
            padding: ".5rem 1rem",
            borderRadius: "4px",
            fontSize: ".875rem",
            color: "#38b48b",
          }}
        >
          pnpm subsidies:update
        </code>
      </div>
    )
  }

  return (
    <div>
      <section
        style={{
          backgroundColor: "var(--bg-surface)",
          border: "1px solid var(--border-soft)",
          borderRadius: "10px",
          padding: "1rem",
          marginBottom: "1.25rem",
        }}
      >
        <label
          htmlFor="subsidy-search"
          style={{
            display: "block",
            color: "var(--text-base)",
            fontSize: ".875rem",
            marginBottom: ".5rem",
            fontWeight: "bold",
          }}
        >
          補助金を検索
        </label>
        <input
          id="subsidy-search"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="制度名、用途、業種、地域で検索"
          style={{
            width: "100%",
            border: "1px solid var(--border-strong)",
            backgroundColor: "#fff",
            color: "var(--text-strong)",
            borderRadius: "8px",
            padding: ".8rem .95rem",
            fontSize: ".95rem",
            outline: "none",
          }}
        />
        <p
          style={{
            color: "var(--text-muted)",
            fontSize: ".8rem",
            marginTop: ".65rem",
          }}
        >
          {query ? `${filtered.length}件ヒット` : `${subsidies.length}件を表示中`}
        </p>
      </section>

      {filtered.length === 0 ? (
        <div
          style={{
            backgroundColor: "var(--bg-surface)",
            border: "1px solid var(--border-soft)",
            borderRadius: "8px",
            padding: "2rem",
            textAlign: "center",
            color: "var(--text-muted)",
          }}
        >
          <p style={{ marginBottom: ".5rem" }}>該当する補助金が見つかりませんでした</p>
          <p style={{ fontSize: ".85rem" }}>
            キーワードを変えて、制度名や用途、地域名で試してください。
          </p>
        </div>
      ) : (
        <div style={{ display: "grid", gap: ".75rem" }}>
          {filtered.map((s) => {
            const st = statusLabel[s.status] ?? statusLabel.unknown
            return (
              <Link
                key={s.id}
                href={`/subsidies/${s.slug}`}
                style={{ textDecoration: "none" }}
              >
                <div
                  style={{
                    backgroundColor: "var(--bg-surface)",
                    borderRadius: "8px",
                    padding: "1.25rem",
                    border: "1px solid var(--border-soft)",
                    transition: "border-color .15s",
                    cursor: "pointer",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: ".75rem",
                      flexWrap: "wrap",
                    }}
                  >
                    <span
                      style={{
                        backgroundColor: st.color + "22",
                        color: st.color,
                        border: `1px solid ${st.color}44`,
                        borderRadius: "4px",
                        padding: ".15rem .5rem",
                        fontSize: ".75rem",
                        whiteSpace: "nowrap",
                        flexShrink: 0,
                      }}
                    >
                      {st.label}
                    </span>
                    <span
                      style={{
                        backgroundColor: "var(--bg-surface-alt)",
                        color: "#94a3b8",
                        borderRadius: "4px",
                        padding: ".15rem .5rem",
                        fontSize: ".75rem",
                        whiteSpace: "nowrap",
                        flexShrink: 0,
                      }}
                    >
                      {regionLabel[s.region] ?? s.region}
                    </span>
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
                      {s.title}
                    </h2>
                  </div>
                  <div
                    style={{
                      marginTop: ".75rem",
                      display: "flex",
                      gap: ".5rem",
                      flexWrap: "wrap",
                    }}
                  >
                    {s.purposes.slice(0, 4).map((p) => (
                      <span
                        key={p}
                        style={{
                          backgroundColor: "var(--bg-tag)",
                          color: "#38b48b",
                          borderRadius: "4px",
                          padding: ".1rem .4rem",
                          fontSize: ".75rem",
                        }}
                      >
                        {p}
                      </span>
                    ))}
                    {s.upperLimit && (
                      <span
                        style={{
                          marginLeft: "auto",
                          color: "#f59e0b",
                          fontSize: ".8rem",
                          whiteSpace: "nowrap",
                        }}
                      >
                        上限 {s.upperLimit}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
