import { FC } from "react"
import Link from "next/link"
import fs from "fs"
import path from "path"
import type { UpdateHistory } from "../lib/types"

function getUpdateHistory(): UpdateHistory | null {
  try {
    const file = path.join(process.cwd(), "data", "generated", "update-history.json")
    return JSON.parse(fs.readFileSync(file, "utf-8"))
  } catch {
    return null
  }
}

const Page: FC = () => {
  const history = getUpdateHistory()

  return (
    <div style={{ maxWidth: "900px", margin: "0 auto" }}>
      <section style={{ textAlign: "center", padding: "4rem 0 3rem" }}>
        <h1
          style={{
            fontSize: "2rem",
            fontWeight: "bold",
            color: "#e0e0ff",
            marginBottom: "1rem",
            lineHeight: 1.3,
          }}
        >
          あなたの事業に合った補助金を
          <br />
          かんたん診断
        </h1>
        <p style={{ color: "#aaa", fontSize: "1rem", marginBottom: "2.5rem", lineHeight: 1.7 }}>
          事業形態・業種・従業員数などを入力するだけで、
          <br />
          国・東京都の補助金をスコアリングして最適なものをご提案します。
        </p>
        <Link
          href="/diagnosis"
          style={{
            display: "inline-block",
            backgroundColor: "#3b82f6",
            color: "#fff",
            padding: "0.875rem 2.5rem",
            borderRadius: "8px",
            textDecoration: "none",
            fontWeight: "bold",
            fontSize: "1.05rem",
            boxShadow: "0 4px 14px rgba(59,130,246,0.4)",
          }}
        >
          診断をはじめる
        </Link>
      </section>

      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "1rem",
          marginBottom: "3rem",
        }}
      >
        {[
          { label: "登録補助金数", value: history ? `${history.totalCount}件` : "—" },
          { label: "JグランツAPI連携", value: history ? `${history.sources.jgrants}件` : "—" },
          { label: "国の補助金", value: history ? `${history.sources.national ?? 0}件` : "—" },
          { label: "東京都独自補助金", value: history ? `${history.sources.tokyo}件` : "—" },
          {
            label: "最終更新",
            value: history
              ? new Date(history.lastUpdated).toLocaleDateString("ja-JP")
              : "未取得",
          },
        ].map((stat) => (
          <div
            key={stat.label}
            style={{
              backgroundColor: "#1e2d4a",
              borderRadius: "8px",
              padding: "1.25rem",
              textAlign: "center",
              border: "1px solid #2a3a5a",
            }}
          >
            <div style={{ color: "#7ec8e3", fontSize: "1.5rem", fontWeight: "bold" }}>
              {stat.value}
            </div>
            <div style={{ color: "#888", fontSize: ".8rem", marginTop: ".25rem" }}>
              {stat.label}
            </div>
          </div>
        ))}
      </section>

      <section style={{ marginBottom: "3rem" }}>
        <h2 style={{ color: "#ccc", fontSize: "1.1rem", marginBottom: "1rem" }}>使い方</h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "1rem",
          }}
        >
          {[
            { step: "1", title: "事業情報を入力", desc: "業種・所在地・従業員数・用途を選択" },
            { step: "2", title: "AIスコアリング", desc: "条件に合う補助金を自動でスコアリング" },
            { step: "3", title: "結果を確認", desc: "おすすめ順に補助金を一覧表示" },
          ].map((item) => (
            <div
              key={item.step}
              style={{
                backgroundColor: "#1e2d4a",
                borderRadius: "8px",
                padding: "1.25rem",
                border: "1px solid #2a3a5a",
              }}
            >
              <div
                style={{
                  backgroundColor: "#3b82f6",
                  color: "#fff",
                  width: "28px",
                  height: "28px",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: ".85rem",
                  fontWeight: "bold",
                  marginBottom: ".75rem",
                }}
              >
                {item.step}
              </div>
              <div style={{ color: "#e0e0ff", fontWeight: "bold", marginBottom: ".25rem" }}>
                {item.title}
              </div>
              <div style={{ color: "#888", fontSize: ".8rem" }}>{item.desc}</div>
            </div>
          ))}
        </div>
      </section>

      <section style={{ textAlign: "center", paddingBottom: "2rem" }}>
        <Link
          href="/subsidies"
          style={{
            color: "#7ec8e3",
            textDecoration: "none",
            fontSize: ".9rem",
          }}
        >
          すべての補助金一覧を見る →
        </Link>
      </section>
    </div>
  )
}

export default Page
