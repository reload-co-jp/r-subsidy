"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { PREFECTURES } from "../../lib/prefectures"
import { purposeLabel } from "../../lib/format"

const PURPOSES = ["デジタル化", "設備投資", "販路拡大", "研究開発", "創業", "人材育成", "省エネ", "事業承継"]

export default function HomeSearchForm() {
  const router = useRouter()
  const [query, setQuery] = useState("")
  const [prefecture, setPrefecture] = useState("all")
  const [purpose, setPurpose] = useState("all")
  const [openOnly, setOpenOnly] = useState(true)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const params = new URLSearchParams()
    if (query.trim()) params.set("q", query.trim())
    if (!openOnly) params.set("status", "all")
    if (prefecture !== "all") params.set("prefecture", prefecture)
    if (purpose !== "all") params.set("purpose", purpose)
    const qs = params.toString()
    router.push(qs ? `/subsidies/?${qs}` : "/subsidies/")
  }

  return (
    <form onSubmit={handleSubmit} role="search" aria-label="補助金検索" style={{ display: "grid", gap: ".85rem" }}>
      <div>
        <label htmlFor="home-q" className="field-label">
          キーワード
        </label>
        <div className="search-row">
          <input
            id="home-q"
            type="search"
            className="input"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="例：ものづくり、IT導入、省エネ設備"
          />
          <button type="submit" className="btn btn-primary">
            検索する
          </button>
        </div>
      </div>
      <div className="grid grid-3" style={{ gap: ".75rem", alignItems: "end" }}>
        <div>
          <label htmlFor="home-pref" className="field-label">
            地域
          </label>
          <select id="home-pref" className="select" value={prefecture} onChange={(e) => setPrefecture(e.target.value)}>
            <option value="all">すべての地域</option>
            <option value="national">国の補助金（全国対象）</option>
            {PREFECTURES.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="home-purpose" className="field-label">
            目的
          </label>
          <select id="home-purpose" className="select" value={purpose} onChange={(e) => setPurpose(e.target.value)}>
            <option value="all">すべての目的</option>
            {PURPOSES.map((p) => (
              <option key={p} value={p}>
                {purposeLabel(p)}
              </option>
            ))}
          </select>
        </div>
        <label style={{ display: "flex", alignItems: "center", gap: ".5rem", minHeight: "44px", fontSize: ".9rem", cursor: "pointer" }}>
          <input type="checkbox" checked={openOnly} onChange={(e) => setOpenOnly(e.target.checked)} style={{ width: 18, height: 18 }} />
          受付中の制度のみ
        </label>
      </div>
    </form>
  )
}
