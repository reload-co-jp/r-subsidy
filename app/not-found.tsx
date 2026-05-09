import { FC } from "react"
import Link from "next/link"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "ページが見つかりません",
  robots: { index: false, follow: false },
}

const NotFound: FC = () => {
  return (
    <div
      style={{
        maxWidth: "600px",
        margin: "4rem auto",
        textAlign: "center",
        padding: "0 1.5rem",
      }}
    >
      <p
        style={{
          fontSize: "5rem",
          fontWeight: "bold",
          color: "#38b48b",
          lineHeight: 1,
          marginBottom: "1rem",
        }}
      >
        404
      </p>
      <h1
        style={{
          fontSize: "1.25rem",
          fontWeight: "bold",
          color: "var(--text-strong)",
          marginBottom: "0.75rem",
        }}
      >
        ページが見つかりません
      </h1>
      <p
        style={{
          color: "var(--text-muted)",
          fontSize: ".9rem",
          lineHeight: 1.7,
          marginBottom: "2rem",
        }}
      >
        URLが変更されたか、ページが削除された可能性があります。
      </p>
      <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
        <Link
          href="/"
          style={{
            backgroundColor: "#38b48b",
            color: "#fff",
            textDecoration: "none",
            padding: ".75rem 1.75rem",
            borderRadius: "8px",
            fontWeight: "bold",
            fontSize: ".95rem",
          }}
        >
          トップへ戻る
        </Link>
        <Link
          href="/subsidies"
          style={{
            backgroundColor: "var(--bg-surface)",
            color: "var(--text-base)",
            textDecoration: "none",
            padding: ".75rem 1.75rem",
            borderRadius: "8px",
            fontWeight: "bold",
            fontSize: ".95rem",
            border: "1px solid var(--border-soft)",
          }}
        >
          補助金一覧
        </Link>
      </div>
    </div>
  )
}

export default NotFound
