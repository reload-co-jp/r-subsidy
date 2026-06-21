"use client"

import type { ReactNode } from "react"
import { PREFECTURES } from "../../lib/prefectures"
import type { UserProfile } from "../../lib/types"
import { INDUSTRIES, PURPOSES } from "./constants"

export default function DiagnosisForm({
  businessType,
  setBusinessType,
  prefecture,
  setPrefecture,
  industry,
  setIndustry,
  employeeCount,
  setEmployeeCount,
  purposes,
  togglePurpose,
  loading,
  error,
  onSubmit,
}: {
  businessType: UserProfile["businessType"]
  setBusinessType: (value: UserProfile["businessType"]) => void
  prefecture: string
  setPrefecture: (value: string) => void
  industry: string
  setIndustry: (value: string) => void
  employeeCount: number
  setEmployeeCount: (value: number) => void
  purposes: string[]
  togglePurpose: (purpose: string) => void
  loading: boolean
  error: string | null
  onSubmit: () => void
}) {
  return (
    <div className="page-content">
      <section style={{ marginBottom: "2rem" }}>
        <h1
          style={{
            color: "var(--text-strong)",
            fontSize: "1.5rem",
            marginBottom: ".75rem",
          }}
        >
          補助金診断
        </h1>
        <p
          style={{
            color: "var(--text-base)",
            fontSize: ".95rem",
            lineHeight: 1.7,
            marginBottom: ".75rem",
          }}
        >
          法人・個人事業主向けに、所在地、業種、従業員数、用途から対象になりやすい補助金を診断できます。
          中小企業向けの国の補助金や東京都の支援制度をまとめて比較できます。
        </p>
        <p
          style={{
            color: "var(--text-muted)",
            fontSize: ".875rem",
            lineHeight: 1.7,
          }}
        >
          入力内容はブラウザ内で処理され、診断結果から各補助金の詳細ページへそのまま移動できます。
        </p>
      </section>

      {error && (
        <div
          style={{
            backgroundColor: "#7f1d1d22",
            border: "1px solid #ef444444",
            borderRadius: "6px",
            padding: ".75rem 1rem",
            color: "#fca5a5",
            fontSize: ".875rem",
            marginBottom: "1rem",
          }}
        >
          {error}
        </div>
      )}

      <div style={{ display: "grid", gap: "1.25rem" }}>
        <Field label="事業形態">
          <div style={{ display: "flex", gap: ".75rem" }}>
            {(["corporation", "sole_proprietor"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setBusinessType(t)}
                style={{
                  flex: 1,
                  padding: ".6rem",
                  borderRadius: "6px",
                  border: `1px solid ${businessType === t ? "#38b48b" : "var(--border-soft)"}`,
                  backgroundColor:
                    businessType === t ? "#38b48b22" : "var(--bg-surface)",
                  color: businessType === t ? "#38b48b" : "var(--text-muted)",
                  cursor: "pointer",
                  fontSize: ".875rem",
                }}
              >
                {t === "corporation" ? "法人" : "個人事業主"}
              </button>
            ))}
          </div>
        </Field>

        <Field label="所在地">
          <select
            value={prefecture}
            onChange={(e) => setPrefecture(e.target.value)}
            style={selectStyle}
          >
            {PREFECTURES.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </Field>

        <Field label="業種">
          <select
            value={industry}
            onChange={(e) => setIndustry(e.target.value)}
            style={selectStyle}
          >
            {INDUSTRIES.map((ind) => (
              <option key={ind} value={ind}>
                {ind}
              </option>
            ))}
          </select>
        </Field>

        <Field label={`従業員数: ${employeeCount}人`}>
          <input
            type="range"
            min={1}
            max={300}
            value={employeeCount}
            onChange={(e) => setEmployeeCount(Number(e.target.value))}
            style={{
              width: "100%",
              accentColor: "#38b48b",
            }}
          />
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              color: "var(--text-soft)",
              fontSize: ".75rem",
            }}
          >
            <span>1人</span>
            <span>300人</span>
          </div>
        </Field>

        <Field label="用途（複数選択可）">
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: ".5rem",
            }}
          >
            {PURPOSES.map((p) => {
              const selected = purposes.includes(p)
              return (
                <button
                  key={p}
                  onClick={() => togglePurpose(p)}
                  style={{
                    padding: ".5rem .75rem",
                    borderRadius: "6px",
                    border: `1px solid ${selected ? "#38b48b" : "var(--border-soft)"}`,
                    backgroundColor: selected
                      ? "#38b48b22"
                      : "var(--bg-surface)",
                    color: selected ? "#38b48b" : "var(--text-muted)",
                    cursor: "pointer",
                    fontSize: ".8rem",
                    textAlign: "left",
                  }}
                >
                  {selected ? "✓ " : ""}
                  {p}
                </button>
              )
            })}
          </div>
        </Field>

        <button
          onClick={onSubmit}
          disabled={loading}
          style={{
            backgroundColor: loading ? "#2b8a6a" : "#38b48b",
            color: "#fff",
            padding: ".875rem",
            borderRadius: "8px",
            border: "none",
            cursor: loading ? "not-allowed" : "pointer",
            fontWeight: "bold",
            fontSize: "1rem",
            marginTop: ".5rem",
          }}
        >
          {loading ? "診断中..." : "診断する"}
        </button>
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <label
        style={{
          color: "var(--text-base)",
          fontSize: ".875rem",
          display: "block",
          marginBottom: ".5rem",
        }}
      >
        {label}
      </label>
      {children}
    </div>
  )
}

const selectStyle: React.CSSProperties = {
  width: "100%",
  backgroundColor: "var(--bg-surface)",
  border: "1px solid var(--border-soft)",
  color: "var(--text-strong)",
  borderRadius: "6px",
  padding: ".75rem .9rem",
  fontSize: ".875rem",
}
