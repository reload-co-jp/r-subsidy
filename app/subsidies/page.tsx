import { FC } from "react"
import Link from "next/link"
import fs from "fs"
import path from "path"
import type { SubsidyIndexItem } from "../../lib/types"

function getSubsidies(): SubsidyIndexItem[] {
  try {
    const file = path.join(process.cwd(), "data", "generated", "subsidies-index.json")
    return JSON.parse(fs.readFileSync(file, "utf-8"))
  } catch {
    return []
  }
}

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

const Page: FC = () => {
  const subsidies = getSubsidies()

  return (
    <div style={{ maxWidth: "900px", margin: "0 auto" }}>
      <div style={{ marginBottom: "1.5rem" }}>
        <h1 style={{ color: "#e0e0ff", fontSize: "1.4rem", marginBottom: ".5rem" }}>
          補助金一覧
        </h1>
        <p style={{ color: "#888", fontSize: ".875rem" }}>
          {subsidies.length > 0 ? `${subsidies.length}件の補助金` : "データが未取得です。pnpm subsidies:update を実行してください。"}
        </p>
      </div>

      {subsidies.length === 0 ? (
        <div
          style={{
            backgroundColor: "#1e2d4a",
            borderRadius: "8px",
            padding: "3rem",
            textAlign: "center",
            color: "#888",
          }}
        >
          <p style={{ marginBottom: "1rem" }}>補助金データがありません</p>
          <code
            style={{
              backgroundColor: "#0d1117",
              padding: ".5rem 1rem",
              borderRadius: "4px",
              fontSize: ".875rem",
              color: "#7ec8e3",
            }}
          >
            pnpm subsidies:update
          </code>
        </div>
      ) : (
        <div style={{ display: "grid", gap: ".75rem" }}>
          {subsidies.map((s) => {
            const st = statusLabel[s.status] ?? statusLabel.unknown
            return (
              <Link
                key={s.id}
                href={`/subsidies/${s.slug}`}
                style={{ textDecoration: "none" }}
              >
                <div
                  style={{
                    backgroundColor: "#1e2d4a",
                    borderRadius: "8px",
                    padding: "1.25rem",
                    border: "1px solid #2a3a5a",
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
                        backgroundColor: "#2a3a5a",
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
                        color: "#e0e0ff",
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
                          backgroundColor: "#1a1a3e",
                          color: "#7ec8e3",
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

export default Page
