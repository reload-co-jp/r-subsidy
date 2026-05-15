"use client"

import { useState } from "react"
import Link from "next/link"
import type { SubsidyNews } from "./page"

export default function NewsListClient({
  news,
  categories,
}: {
  news: SubsidyNews[]
  categories: string[]
}) {
  const [filter, setFilter] = useState("all")

  const filtered = filter === "all" ? news : news.filter((n) => n.category === filter)

  if (news.length === 0) {
    return (
      <div
        style={{
          padding: "3rem",
          textAlign: "center",
          color: "var(--text-muted)",
          backgroundColor: "var(--bg-surface)",
          border: "1px solid var(--border-soft)",
          borderRadius: "10px",
        }}
      >
        ニュース記事はまだありません。
      </div>
    )
  }

  return (
    <>
      <div style={{ display: "flex", flexWrap: "wrap", gap: ".5rem", marginBottom: "1.25rem" }}>
        {["all", ...categories].map((cat) => {
          const selected = filter === cat
          return (
            <button
              key={cat}
              type="button"
              onClick={() => setFilter(cat)}
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
              {cat === "all" ? "すべて" : cat}
            </button>
          )
        })}
      </div>

      <div style={{ display: "grid", gap: "1rem" }}>
        {filtered.map((n) => (
          <article
            key={n.id}
            style={{
              backgroundColor: "var(--bg-surface)",
              border: "1px solid var(--border-soft)",
              borderRadius: "10px",
              padding: "1.25rem 1.5rem",
            }}
          >
            <div style={{ display: "flex", gap: ".5rem", flexWrap: "wrap", marginBottom: ".75rem" }}>
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
                {n.category}
              </span>
              <span
                style={{
                  color: "var(--text-muted)",
                  fontSize: ".75rem",
                  alignSelf: "center",
                }}
              >
                {n.publishedAt}
              </span>
            </div>

            <Link
              href={`/news/${n.id}`}
              style={{ textDecoration: "none" }}
            >
              <h2
                style={{
                  color: "var(--text-strong)",
                  fontSize: "1rem",
                  fontWeight: "bold",
                  marginBottom: ".5rem",
                  lineHeight: 1.5,
                }}
              >
                {n.title}
              </h2>
            </Link>

            <p
              style={{
                color: "var(--text-base)",
                fontSize: ".875rem",
                lineHeight: 1.7,
                marginBottom: ".75rem",
              }}
            >
              {n.summary}
            </p>

            <div style={{ display: "flex", gap: ".4rem", flexWrap: "wrap", marginBottom: ".75rem" }}>
              {n.tags.map((tag) => (
                <span
                  key={tag}
                  style={{
                    backgroundColor: "var(--bg-surface-alt)",
                    color: "var(--text-muted)",
                    borderRadius: "4px",
                    padding: ".15rem .5rem",
                    fontSize: ".72rem",
                  }}
                >
                  #{tag}
                </span>
              ))}
            </div>

            <Link
              href={`/news/${n.id}`}
              style={{
                color: "#38b48b",
                fontSize: ".825rem",
                textDecoration: "none",
              }}
            >
              続きを読む →
            </Link>
          </article>
        ))}
      </div>
    </>
  )
}
