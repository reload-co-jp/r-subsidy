"use client"

import { useState } from "react"
import Link from "next/link"
import type { NormalizedSubsidy, UserProfile, ScoringResult, Tier } from "../../lib/types"
import { scoreAndSort } from "../../lib/scoring"

const PREFECTURES = [
  "東京都", "北海道", "青森県", "岩手県", "宮城県", "秋田県", "山形県", "福島県",
  "茨城県", "栃木県", "群馬県", "埼玉県", "千葉県", "神奈川県",
  "新潟県", "富山県", "石川県", "福井県", "山梨県", "長野県",
  "岐阜県", "静岡県", "愛知県", "三重県", "滋賀県", "京都府", "大阪府", "兵庫県",
  "奈良県", "和歌山県", "鳥取県", "島根県", "岡山県", "広島県", "山口県",
  "徳島県", "香川県", "愛媛県", "高知県",
  "福岡県", "佐賀県", "長崎県", "熊本県", "大分県", "宮崎県", "鹿児島県", "沖縄県",
]

const INDUSTRIES = [
  "製造業", "建設業", "小売業", "卸売業", "飲食業", "宿泊業",
  "情報通信業", "サービス業", "医療・福祉", "農業・林業・漁業",
  "不動産業", "教育・学習支援業", "その他",
]

const PURPOSES = [
  "設備投資", "人材育成", "販路拡大", "研究開発",
  "事業承継", "創業", "省エネ", "デジタル化",
]

const TIER_CONFIG: Record<Tier, { label: string; color: string; bg: string }> = {
  strong: { label: "強くおすすめ", color: "#22c55e", bg: "#22c55e22" },
  match: { label: "条件一致", color: "#38b48b", bg: "#38b48b22" },
  check: { label: "要確認", color: "#94a3b8", bg: "#94a3b822" },
}

type Step = "form" | "result"

export default function DiagnosisClient() {
  const [step, setStep] = useState<Step>("form")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [results, setResults] = useState<ScoringResult[]>([])

  const [businessType, setBusinessType] = useState<UserProfile["businessType"]>("corporation")
  const [prefecture, setPrefecture] = useState("東京都")
  const [industry, setIndustry] = useState("製造業")
  const [employeeCount, setEmployeeCount] = useState(20)
  const [purposes, setPurposes] = useState<string[]>([])

  const togglePurpose = (p: string) => {
    setPurposes((prev) => (prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]))
  }

  const handleSubmit = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/data/subsidies-master.json")
      if (!res.ok) throw new Error("データを取得できませんでした")
      const subsidies: NormalizedSubsidy[] = await res.json()

      const profile: UserProfile = { businessType, prefecture, industry, employeeCount, purposes }
      const activeSubsidies = subsidies.filter((subsidy) => subsidy.status !== "closed")
      const scored = scoreAndSort(activeSubsidies, profile)
      setResults(scored)
      setStep("result")
    } catch (e) {
      setError(e instanceof Error ? e.message : "エラーが発生しました")
    } finally {
      setLoading(false)
    }
  }

  if (step === "result") {
    const grouped: Record<Tier, ScoringResult[]> = { strong: [], match: [], check: [] }
    for (const r of results) grouped[r.tier].push(r)

    return (
      <div style={{ maxWidth: "800px", margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
          <h1 style={{ color: "var(--text-strong)", fontSize: "1.3rem" }}>補助金診断結果</h1>
          <button
            onClick={() => setStep("form")}
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
          <div style={{ color: "var(--text-muted)", textAlign: "center", padding: "3rem" }}>
            データが未取得です。pnpm subsidies:update を実行してください。
          </div>
        ) : (
          (["strong", "match", "check"] as Tier[]).map((tier) => {
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
                    <Link key={r.subsidy.id} href={`/subsidies/${r.subsidy.slug}`} style={{ textDecoration: "none" }}>
                      <div
                        style={{
                          backgroundColor: "var(--bg-surface)",
                          borderRadius: "8px",
                          padding: "1rem 1.25rem",
                          border: `1px solid ${tc.color}33`,
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          gap: "1rem",
                        }}
                      >
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ color: "var(--text-strong)", fontSize: ".9rem", fontWeight: "bold", marginBottom: ".25rem" }}>
                            {r.subsidy.title}
                          </div>
                          <div style={{ color: "var(--text-muted)", fontSize: ".75rem" }}>
                            {r.subsidy.upperLimit && `上限 ${r.subsidy.upperLimit} ／ `}
                            {r.subsidy.purposes.slice(0, 3).join("・")}
                          </div>
                        </div>
                        <div style={{ textAlign: "right", flexShrink: 0 }}>
                          <div style={{ color: tc.color, fontSize: "1.2rem", fontWeight: "bold" }}>
                            {r.score}
                          </div>
                          <div style={{ color: "var(--text-soft)", fontSize: ".7rem" }}>スコア</div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )
          })
        )}
      </div>
    )
  }

  return (
    <div style={{ maxWidth: "760px", margin: "0 auto" }}>
      <section style={{ marginBottom: "2rem" }}>
        <h1 style={{ color: "var(--text-strong)", fontSize: "1.5rem", marginBottom: ".75rem" }}>補助金診断</h1>
        <p style={{ color: "var(--text-base)", fontSize: ".95rem", lineHeight: 1.7, marginBottom: ".75rem" }}>
          法人・個人事業主向けに、所在地、業種、従業員数、用途から対象になりやすい補助金を診断できます。
          中小企業向けの国の補助金や東京都の支援制度をまとめて比較できます。
        </p>
        <p style={{ color: "var(--text-muted)", fontSize: ".875rem", lineHeight: 1.7 }}>
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
                  border: `1px solid ${businessType === t ? "#38b48b" : "#2a3a5a"}`,
                  backgroundColor: businessType === t ? "#38b48b22" : "var(--bg-surface)",
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
              <option key={p} value={p}>{p}</option>
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
              <option key={ind} value={ind}>{ind}</option>
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
            style={{ width: "100%", accentColor: "#38b48b" }}
          />
          <div style={{ display: "flex", justifyContent: "space-between", color: "var(--text-soft)", fontSize: ".75rem" }}>
            <span>1人</span>
            <span>300人</span>
          </div>
        </Field>

        <Field label="用途（複数選択可）">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: ".5rem" }}>
            {PURPOSES.map((p) => {
              const selected = purposes.includes(p)
              return (
                <button
                  key={p}
                  onClick={() => togglePurpose(p)}
                  style={{
                    padding: ".5rem .75rem",
                    borderRadius: "6px",
                    border: `1px solid ${selected ? "#38b48b" : "#2a3a5a"}`,
                    backgroundColor: selected ? "#38b48b22" : "var(--bg-surface)",
                    color: selected ? "#38b48b" : "var(--text-muted)",
                    cursor: "pointer",
                    fontSize: ".8rem",
                    textAlign: "left",
                  }}
                >
                  {selected ? "✓ " : ""}{p}
                </button>
              )
            })}
          </div>
        </Field>

        <button
          onClick={handleSubmit}
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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ color: "var(--text-base)", fontSize: ".875rem", display: "block", marginBottom: ".5rem" }}>
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
