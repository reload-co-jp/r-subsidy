"use client"

import type { ScoringResult, Tier } from "../../lib/types"
import SubsidyCard from "../../components/elements/subsidy-card"
import { TIER_CONFIG } from "./constants"

const TIER_ORDER: Tier[] = ["strong", "match", "check"]

export default function DiagnosisResult({
  results,
  onReset,
}: {
  results: ScoringResult[]
  onReset: () => void
}) {
  const grouped: Record<Tier, ScoringResult[]> = {
    strong: [],
    match: [],
    check: [],
  }
  for (const r of results) grouped[r.tier].push(r)

  return (
    <div className="page-content">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "1.5rem",
        }}
      >
        <h1 style={{ color: "var(--text-strong)", fontSize: "1.3rem" }}>
          補助金診断結果
        </h1>
        <button
          onClick={onReset}
          style={{
            background: "none",
            border: "1px solid #2a3a5a",
            color: "#38b48b",
            padding: ".4rem .8rem",
            borderRadius: "6px",
            cursor: "pointer",
            fontSize: ".875rem",
          }}
        >
          再診断
        </button>
      </div>

      {results.length === 0 ? (
        <div
          style={{
            color: "var(--text-muted)",
            textAlign: "center",
            padding: "3rem",
          }}
        >
          データが未取得です。pnpm subsidies:update を実行してください。
        </div>
      ) : (
        TIER_ORDER.map((tier) => {
          if (grouped[tier].length === 0) return null
          const tc = TIER_CONFIG[tier]
          return (
            <section key={tier} style={{ marginBottom: "2rem" }}>
              <h2
                style={{
                  color: tc.color,
                  fontSize: ".9rem",
                  fontWeight: "bold",
                  marginBottom: ".75rem",
                  display: "flex",
                  alignItems: "center",
                  gap: ".5rem",
                }}
              >
                <span
                  style={{
                    backgroundColor: tc.bg,
                    border: `1px solid ${tc.color}44`,
                    borderRadius: "4px",
                    padding: ".2rem .6rem",
                  }}
                >
                  {tc.label}
                </span>
                <span style={{ color: "#888", fontWeight: "normal" }}>
                  {grouped[tier].length}件
                </span>
              </h2>
              <div style={{ display: "grid", gap: ".6rem" }}>
                {grouped[tier].map((r) => (
                  <SubsidyCard
                    key={r.subsidy.id}
                    slug={r.subsidy.slug}
                    title={r.subsidy.title}
                    upperLimit={r.subsidy.upperLimit}
                    purposes={r.subsidy.purposes}
                    maxPurposes={3}
                    accentColor={tc.color}
                    trailing={
                      <>
                        <div
                          style={{
                            color: tc.color,
                            fontSize: "1.2rem",
                            fontWeight: "bold",
                          }}
                        >
                          {r.score}
                        </div>
                        <div
                          style={{
                            color: "var(--text-soft)",
                            fontSize: ".7rem",
                          }}
                        >
                          スコア
                        </div>
                      </>
                    }
                  />
                ))}
              </div>
            </section>
          )
        })
      )}
    </div>
  )
}
