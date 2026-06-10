"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

const PURPOSES = ["設備投資", "デジタル化", "研究開発", "販路拡大", "人材育成", "省エネ", "創業", "事業承継"]

export default function HomeSearchForm() {
  const router = useRouter()
  const [query, setQuery] = useState("")
  const [status, setStatus] = useState<"open" | "all">("open")
  const [purpose, setPurpose] = useState("all")

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const params = new URLSearchParams()
    if (query.trim()) params.set("q", query.trim())
    params.set("status", status)
    if (purpose !== "all") params.set("purpose", purpose)
    router.push(`/subsidies?${params.toString()}`)
  }

  return (
    <form onSubmit={handleSubmit}>
      <div style={{ display: "flex", gap: ".5rem", marginBottom: ".75rem" }}>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="制度名、用途、業種、地域で検索"
          style={{
            flex: 1,
            border: "1px solid var(--border-strong)",
            backgroundColor: "#fff",
            color: "var(--text-strong)",
            borderRadius: "8px",
            padding: ".75rem .95rem",
            fontSize: ".95rem",
            outline: "none",
          }}
        />
        <button
          type="submit"
          style={{
            backgroundColor: "#38b48b",
            color: "#fff",
            border: "none",
            borderRadius: "8px",
            padding: ".75rem 1.25rem",
            fontSize: ".9rem",
            fontWeight: "bold",
            cursor: "pointer",
            whiteSpace: "nowrap",
          }}
        >
          検索
        </button>
      </div>
      <div style={{ display: "flex", gap: ".5rem", flexWrap: "wrap", marginBottom: ".6rem" }}>
        {(
          [
            { value: "open", label: "受付中", color: "#22c55e" },
            { value: "all", label: "すべて", color: "#5f766d" },
          ] as const
        ).map((opt) => {
          const selected = status === opt.value
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => setStatus(opt.value)}
              style={{
                borderRadius: "999px",
                border: `1px solid ${selected ? opt.color : "var(--border-soft)"}`,
                backgroundColor: selected ? `${opt.color}22` : "var(--bg-surface-alt)",
                color: selected ? opt.color : "var(--text-base)",
                padding: ".4rem .75rem",
                fontSize: ".8rem",
                cursor: "pointer",
              }}
            >
              {opt.label}
            </button>
          )
        })}
      </div>
      <div style={{ display: "flex", gap: ".5rem", flexWrap: "wrap" }}>
        {["all", ...PURPOSES].map((p) => {
          const selected = purpose === p
          return (
            <button
              key={p}
              type="button"
              onClick={() => setPurpose(p)}
              style={{
                borderRadius: "999px",
                border: `1px solid ${selected ? "#38b48b" : "var(--border-soft)"}`,
                backgroundColor: selected ? "#38b48b22" : "var(--bg-surface-alt)",
                color: selected ? "#38b48b" : "var(--text-base)",
                padding: ".4rem .75rem",
                fontSize: ".8rem",
                cursor: "pointer",
              }}
            >
              {p === "all" ? "すべての分野" : p}
            </button>
          )
        })}
      </div>
    </form>
  )
}
